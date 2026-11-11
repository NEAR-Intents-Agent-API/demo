import assert from "node:assert/strict";
import { test } from "node:test";
import { extractOrderPreview } from "../../features/funds/model/quote";
import { warningMessage } from "../../features/funds/model/quote-warnings";
import { operationActionLabel } from "../../features/funds/operations/operation-display-utils";
import { operationEvidence } from "../../features/funds/operations/operation-evidence";
import { describeOperation } from "../../features/funds/operations/operation-status";
import {
  appFeeLabel,
  fillStatusLabel,
  isResting,
  orderTitle,
  readCancelRound,
} from "../../features/funds/orders/order-display";
import { buildOrderRequest, orderReason } from "../../features/funds/orders/use-place-order";
import { humanizeRequestType } from "../../features/wallet/approvals/approval-display-utils";
import { errorMessage, isRetryable } from "../../lib/http/messages";

const NEAR = { assetId: "nep141:wrap.near", symbol: "NEAR", decimals: 24 } as never;
const USDC = { assetId: "nep141:usdc.near", symbol: "USDC", decimals: 6 } as never;
const find = (asset: string) =>
  asset === "nep141:wrap.near"
    ? { symbol: "NEAR", decimals: 24 }
    : asset === "nep141:usdc.near"
      ? { symbol: "USDC", decimals: 6 }
      : undefined;

test("a limit order that succeeded is resting, not done", () => {
  const placed = describeOperation("SUCCESS", { type: "limit_order" });
  assert.equal(placed.tone, "ok");
  assert.match(placed.line, /resting/);
  assert.match(placed.line, /not filled yet/);
  assert.equal(describeOperation("SUCCESS", { type: "swap" }).line, "Done. The move settled.");
  assert.equal(describeOperation("SUCCESS").line, "Done. The move settled.");
  assert.match(describeOperation("PENDING_APPROVAL", { type: "limit_order" }).line, /approval/);
});

test("a limit order operation is labelled and its recorded terms are read from the request", () => {
  const operation = {
    type: "limit_order",
    details: {
      action: "limit_order",
      order_id: "ord_1",
      request: {
        side: "buy",
        price: "5.2",
        quantity: "1000000000000000000000000",
        origin_asset: "nep141:usdc.near",
        destination_asset: "nep141:wrap.near",
        deadline: "2026-11-12T10:00:00.000Z",
      },
    },
  };
  assert.equal(operationActionLabel(operation as never), "Limit order");
  const evidence = operationEvidence(operation);
  assert.equal(evidence.orderId, "ord_1");
  // A buy spends the quote asset, so the base asset is what it receives.
  assert.deepEqual(evidence.limitOrder, {
    side: "buy",
    baseAsset: "nep141:wrap.near",
    quoteAsset: "nep141:usdc.near",
    quantity: "1000000000000000000000000",
    price: "5.2",
    deadline: "2026-11-12T10:00:00.000Z",
  });
  assert.equal(operationEvidence({ details: { request: { side: "sell" } } }).limitOrder, null);
  assert.equal(operationEvidence({ details: {} }).orderId, null);
});

test("orders read in plain words, with 1Click's fee as a percentage", () => {
  const order = {
    order_id: "o1",
    side: "sell",
    base_asset: "nep141:wrap.near",
    quote_asset: "nep141:usdc.near",
    quantity: "1500000000000000000000000",
    price: "5.2",
    fill_status: "partially_filled",
    app_fees: [{ recipient: "fee.near", fee: 20 }],
  } as never;
  assert.equal(orderTitle(order, find), "Sell 1.5 NEAR at 5.2 USDC");
  assert.equal(appFeeLabel(order), "0.2%");
  assert.equal(appFeeLabel({ order_id: "o2" } as never), null);
  assert.equal(isResting(order), true);
  assert.equal(isResting({ order_id: "o3", fill_status: "filled" } as never), false);
  assert.equal(fillStatusLabel("partially_filled"), "Partly filled");
  assert.equal(fillStatusLabel("canceled"), "Cancelled");
  assert.equal(fillStatusLabel(undefined), "Unknown");
});

test("a cancel-all round is read only when every count and the flag are there", () => {
  const round = { known: 50, cancelled: 50, failed: 0, remaining: 3, complete: false };
  assert.deepEqual(readCancelRound({ data: round }), round);
  assert.equal(readCancelRound({ data: { ...round, complete: undefined } }), null);
  assert.equal(readCancelRound({ data: { ...round, cancelled: "50" } }), null);
  assert.equal(readCancelRound({ round }), null);
  assert.equal(readCancelRound(null), null);
});

test("a dry order reads its terms, USD value, approval hold and warnings", () => {
  const preview = extractOrderPreview({
    data: {
      dry: true,
      type: "limit_order",
      quote: { spend_amount: "1000", min_amount_out: "5200000" },
      spend: { amount_usd: "5.200000", budget: {} },
      owner_approval: true,
      warnings: [{ code: "policy_price_deviation_exceeded", detail: "ignored" }],
    },
  });
  assert.equal(preview.quote?.spend_amount, "1000");
  assert.equal(preview.spendUsd, "5.200000");
  assert.equal(preview.ownerApproval, true);
  assert.deepEqual(preview.warnings, [{ code: "policy_price_deviation_exceeded" }]);
  assert.equal(extractOrderPreview(null).quote, null);
});

test("an order is only quotable with two tokens, an amount and an exact price", () => {
  const input = {
    base: NEAR,
    quote: USDC,
    side: "sell" as const,
    quantity: 5n,
    price: "5.2",
  };
  assert.deepEqual(buildOrderRequest(input), {
    base_asset: "nep141:wrap.near",
    quote_asset: "nep141:usdc.near",
    side: "sell",
    quantity: "5",
    price: "5.2",
  });
  for (const patch of [
    { quote: NEAR },
    { quote: null },
    { quantity: 0n },
    { quantity: null },
    { price: "" },
    { price: "0" },
    { price: "1e3" },
  ])
    assert.equal(buildOrderRequest({ ...input, ...patch }), null, Object.keys(patch).join());
  assert.equal(orderReason({ ...input }), null);
  assert.equal(orderReason({ ...input, price: "" }), "Enter a price");
  assert.equal(orderReason({ ...input, quote: null }), "Choose the token the price is in");
});

test("the new refusals have plain messages, and only a missing price is worth retrying", () => {
  for (const code of [
    "policy_price_deviation_exceeded",
    "market_price_unavailable",
    "limit_order_not_found",
    "limit_orders_open",
  ])
    assert.notEqual(errorMessage(code), errorMessage("unknown_code_for_test"), code);
  assert.equal(isRetryable("market_price_unavailable"), true);
  for (const code of [
    "policy_price_deviation_exceeded",
    "limit_order_not_found",
    "limit_orders_open",
  ])
    assert.equal(isRetryable(code), false, code);
  assert.match(
    warningMessage({ code: "policy_price_deviation_exceeded" }, null),
    /further from the market/,
  );
});

test("an approval for an order reads as a limit order", () => {
  assert.equal(humanizeRequestType("limit_order"), "limit order");
  assert.equal(humanizeRequestType("create_limit_order"), "limit order");
  assert.equal(humanizeRequestType("INTENTS_SWAP"), "intents swap");
});
