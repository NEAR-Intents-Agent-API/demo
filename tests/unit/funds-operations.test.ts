import assert from "node:assert/strict";
import { test } from "node:test";
import type { BalanceEntry } from "@near-intents-agent-api/sdk";
import { createElement } from "react";
import { renderToStaticMarkup } from "react-dom/server";
import { withdrawFacts } from "../../features/funds/model/quote";
import {
  operationActionLabel,
  operationAmountLabel,
  operationMadeBy,
  statusTone,
} from "../../features/funds/operations/operation-display-utils";
import { operationEvidence } from "../../features/funds/operations/operation-evidence";
import { describeOperation, failureReason } from "../../features/funds/operations/operation-status";
import { OperationTrackerFacts } from "../../features/funds/operations/operation-tracker-facts";
import { combineTotals, portfolioTotal } from "../../features/funds/portfolio/portfolio-total";
import { type Holding, toHolding } from "../../features/funds/use-funds";
import { activityOutcome } from "../../features/mcp/activity/activity-outcome";
import { errorMessage } from "../../lib/http/messages";

const txHash = "9VqfTxHashSourceChainAAAAAAAAAAAAAAAAAAAAAAAAAAAA";
const destinationHash = "0xdestinationhashBBBBBBBBBBBBBBBBBBBBBBBBBBBBBBBB";
const refundHash = "refundhashCCCCCCCCCCCCCCCCCCCCCCCCCCCC";

test("operationEvidence reads the snake_case wire fields", () => {
  const evidence = operationEvidence({
    details: {
      tx_hash: txHash,
      destination_tx_hash: destinationHash,
      refund_tx_hash: refundHash,
      refund_to: "agent.near",
      refunded_amount: "5000",
      execute_after: "2026-10-13T10:00:00.000Z",
      txHash: "camelCase is not the wire",
    },
  });
  assert.equal(evidence.txHash, txHash);
  assert.equal(evidence.destinationTxHash, destinationHash);
  assert.equal(evidence.refundTxHash, refundHash);
  assert.equal(evidence.refundTo, "agent.near");
  assert.equal(evidence.refundedAmount, "5000");
  assert.equal(evidence.executeAfter, "2026-10-13T10:00:00.000Z");
  assert.equal(operationEvidence(null).txHash, null);
});

test("tracker facts show both hashes, the refund outcome and a plain failure reason", () => {
  const markup = renderToStaticMarkup(
    createElement(OperationTrackerFacts, {
      status: "REFUNDED",
      operationId: "op_1",
      failureCode: "route_unavailable",
      token: { symbol: "USDC", decimals: 6 },
      details: {
        tx_hash: txHash,
        destination_tx_hash: destinationHash,
        refund_tx_hash: refundHash,
        refund_to: "agent.near",
        refunded_amount: "2500000",
      },
    }),
  );
  for (const value of [txHash, destinationHash, refundHash, "agent.near"])
    assert.ok(markup.includes(value), `${value} is shown in full (copy value / title)`);
  assert.ok(markup.includes("2.5 USDC"), "refunded amount reads in token units");
  assert.ok(!markup.includes(">route_unavailable<"), "the raw failure code is not the reason");
});

test("status lines do not overclaim", () => {
  // The API's FAILED means provably never executed or failed with a recorded reason.
  const failed = describeOperation("FAILED", { failureCode: "route_unavailable" }).line;
  assert.ok(failed.startsWith("This move did not go through: "));
  assert.ok(failed.includes(errorMessage("route_unavailable")));
  assert.ok(!failed.includes("may have gone through"));
  assert.equal(describeOperation("FAILED").line, "This move did not go through.");
  const sent = describeOperation("FAILED", { hasTransaction: true }).line;
  assert.ok(sent.includes("A transaction was recorded"));
  assert.ok(!sent.includes("may have gone through"));
  const queued = describeOperation("QUEUED", { executeAfter: "2026-10-13T10:00:00.000Z" }).line;
  assert.ok(queued.includes("Oct 13, 2026"), "a queued move says when it runs");
  assert.ok(queued.includes("cancel it in Rules"));
  assert.ok(!describeOperation("PENDING_APPROVAL").line.includes("second"));
  assert.ok(describeOperation("UNCERTAIN").line.includes("Do not repeat"));
});

test("refunded and failed operations never read as success", () => {
  assert.equal(statusTone("REFUNDED"), "attention");
  assert.equal(statusTone("FAILED"), "blocked");
  assert.equal(statusTone("SUCCESS"), "ok");
});

test("operations say who made them and how much moved", () => {
  const operation = {
    type: "withdraw",
    grant: { id: "g1", label: "Claude" },
    details: { action: "withdraw", token: "nep141:usdc", amount: "1500000" },
  } as unknown as Parameters<typeof operationMadeBy>[0];
  assert.equal(operationMadeBy(operation), "Claude");
  assert.equal(operationMadeBy({ ...operation, grant: null } as typeof operation), "Owner");
  assert.equal(operationActionLabel(operation), "Withdraw funds");
  assert.equal(
    operationAmountLabel(operation, () => ({ symbol: "USDC", decimals: 6 })),
    "1.5 USDC",
  );
  assert.equal(
    operationAmountLabel(operation, () => undefined),
    null,
  );
});

test("client requests report the operation's current status, not the call-time snapshot", () => {
  const statuses = new Map([
    ["op_1", "FAILED"],
    ["op_2", "REFUNDED"],
  ]);
  assert.deepEqual(activityOutcome({ status: "QUEUED", operationId: "op_1" }, statuses), {
    label: "failed",
    tone: "blocked",
  });
  assert.equal(
    activityOutcome({ status: "SUCCESS", operationId: "op_2" }, statuses).tone,
    "attention",
  );
  assert.equal(activityOutcome({ status: "error", operationId: null }, statuses).tone, "blocked");
  assert.equal(activityOutcome({ status: "read", operationId: null }, statuses).tone, "neutral");
  const unloaded = activityOutcome({ status: "SUCCESS", operationId: "old" }, statuses);
  assert.ok(unloaded.label.endsWith("at request time"));
});

function entry(overrides: Partial<BalanceEntry>): BalanceEntry {
  return {
    asset_id: "nep141:usdc.near",
    symbol: "USDC",
    decimals: 6,
    blockchain: "near",
    price: 1,
    price_updated_at: "2026-10-13T10:00:00.000Z",
    price_expires_at: "2026-10-13T10:05:00.000Z",
    balance_raw: "2000000",
    balance: "2",
    ...overrides,
  };
}
const now = Date.parse("2026-10-13T10:01:00.000Z");
const none = () => undefined;

test("holdings keep unknown prices unknown and fall back to catalogue decimals", () => {
  const priced = toHolding(entry({}), none, now);
  assert.equal(priced.priceUsd, 1);
  const expired = toHolding(entry({ price_expires_at: "2026-10-13T10:00:30.000Z" }), none, now);
  assert.equal(expired.priceUsd, null);
  assert.equal(expired.priceExpired, true);
  const unpriced = toHolding(
    entry({ price: null, price_updated_at: null, price_expires_at: null }),
    none,
    now,
  );
  assert.equal(unpriced.priceUsd, null);
  assert.equal(unpriced.priceExpired, false);
  const unknownDecimals = toHolding(
    entry({ decimals: null }),
    () => ({
      assetId: "nep141:usdc.near",
      defuseAssetId: null,
      symbol: "USDC",
      decimals: 6,
      chain: "near",
      chains: ["near"],
    }),
    now,
  );
  assert.equal(unknownDecimals.decimals, 6);
});

test("totals leave unpriced holdings out and say how many", () => {
  const holdings: Holding[] = [
    toHolding(entry({ balance_raw: "3000000" }), none, now),
    toHolding(
      entry({
        asset_id: "nep141:mystery",
        price: null,
        price_updated_at: null,
        price_expires_at: null,
      }),
      none,
      now,
    ),
  ];
  const total = portfolioTotal(holdings);
  assert.equal(total.usd, 3);
  assert.equal(total.unpriced, 1);
  assert.equal(total.asOf, "2026-10-13T10:00:00.000Z");
  const both = combineTotals(
    total,
    portfolioTotal([toHolding(entry({ balance_raw: "1000000" }), none, now)]),
  );
  assert.equal(both.usd, 4);
  assert.equal(both.unpriced, 1);
});

test("withdraw facts read the quote's amounts and the API's top-level fee, not a provider fee key", () => {
  const facts = withdrawFacts({
    quote: {
      amount_out: "990000",
      min_amount_out: "980000",
      min_amount: "100000",
      fee_amount: "10000",
      fee_token: "nep141:usdc.near",
    },
    fee: { amount_usd: "0.01", percent: "1" },
  });
  assert.equal(facts.received, "990000");
  assert.equal(facts.minimumReceived, "980000");
  assert.equal(facts.minimumAmount, "100000");
  assert.deepEqual(facts.fee, { amount_usd: "0.01", percent: "1" });
  // A bridged withdrawal: the provider still states a fee, the API does not value it.
  assert.equal(
    withdrawFacts({ quote: { amount_out: "1", fee_amount: "10" }, fee: null }).fee,
    null,
  );
  assert.equal(withdrawFacts(null).received, null);
});

test("an amount_too_low failure names the route minimum in the token's units", () => {
  const facts = { minAmount: "1500000", token: { symbol: "USDC", decimals: 6 } };
  const line = describeOperation("FAILED", { failureCode: "amount_too_low", ...facts }).line;
  assert.ok(line.startsWith("This move did not go through: "));
  assert.ok(line.includes("1.5 USDC"), line);
  assert.equal(
    describeOperation("FAILED", { failureCode: "amount_too_low", minAmount: "1500000" }).line,
    "This move did not go through: This amount is below the minimum for this route, 1500000 base units. Send at least that.",
  );
  // Without a recorded minimum, or with a malformed one, the shared message is the fallback.
  for (const minAmount of [null, undefined, "", "1.5", "abc"])
    assert.ok(
      describeOperation("FAILED", { failureCode: "amount_too_low", minAmount }).line.includes(
        errorMessage("amount_too_low"),
      ),
      String(minAmount),
    );
  assert.equal(failureReason("route_unavailable", facts), errorMessage("route_unavailable"));
  assert.equal(operationEvidence({ details: { min_amount: "1500000" } }).minAmount, "1500000");
  const markup = renderToStaticMarkup(
    createElement(OperationTrackerFacts, {
      status: "FAILED",
      operationId: "op_2",
      failureCode: "amount_too_low",
      token: facts.token,
      details: { min_amount: facts.minAmount },
    }),
  );
  assert.ok(markup.includes("1.5 USDC"), "the facts row reads the minimum in token units");
});
