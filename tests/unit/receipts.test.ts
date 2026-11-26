import assert from "node:assert/strict";
import { test } from "node:test";
import type { ReceiptItem, ReceiptTerms } from "@near-intents-agent-api/sdk";
import {
  receiptAmountLabel,
  receiptStatusLabel,
  receiptTermRows,
  receiptUsdLabel,
} from "../../features/funds/receipts/receipt-display";
import { termsMismatches } from "../../lib/agent-api/receipts";
import { executionNoteSchema, paymentReferenceSchema } from "../../lib/agent-api/schemas";
import { parseReceiptPins } from "../../lib/config/env";
import { errorMessage, isRetryable } from "../../lib/http/messages";

const transfer: ReceiptItem = {
  correlation_id: `op_${"a".repeat(43)}`,
  type: "transfer",
  status: "PROVEN",
  details: {
    asset: "nep141:usdc.near",
    amount: "1500000",
    recipient: "alice.near",
    confidential: true,
    reference: "inv-42",
    settled_at: "2026-11-10T10:00:00.000Z",
    usd_value: "1.50",
  },
  receipt: null,
};
const find = (asset: string) =>
  asset === "nep141:usdc.near" ? { symbol: "USDC", decimals: 6 } : undefined;

test("verified terms that match the API's listing report no mismatch", () => {
  const terms: ReceiptTerms = {
    type: "transfer",
    asset: "nep141:usdc.near",
    amount: "1500000",
    recipient: "alice.near",
    confidential: true,
    reference: "inv-42",
  };
  assert.deepEqual(termsMismatches(transfer, terms), []);
});

test("every field the log committed to that the API shows differently is named", () => {
  const terms: ReceiptTerms = {
    type: "transfer",
    asset: "nep141:usdc.near",
    amount: "9000000",
    recipient: "mallory.near",
    confidential: false,
  };
  assert.deepEqual(termsMismatches(transfer, terms), ["amount", "recipient", "confidential"]);
});

test("a type or a committed field the listing lacks is a mismatch", () => {
  const terms: ReceiptTerms = {
    type: "withdraw",
    asset: "nep141:usdc.near",
    amount: "1500000",
    recipient: "alice.near",
    confidential: true,
    chain: "eth",
  };
  assert.deepEqual(termsMismatches(transfer, terms), ["type", "chain"]);
});

test("receipt amounts and values read in token units", () => {
  assert.equal(receiptAmountLabel(transfer, find), "1.5 USDC");
  assert.equal(receiptUsdLabel(transfer), "$1.50");
  assert.equal(
    receiptAmountLabel({ ...transfer, details: { ...transfer.details, asset: "x" } }, find),
    null,
  );
  assert.equal(receiptStatusLabel("UNLOGGED"), "no receipt");
});

const swapReceipt = (details: Record<string, unknown>) =>
  ({
    correlation_id: `op_${"b".repeat(43)}`,
    type: "swap",
    status: "PROVEN",
    details: {
      origin_asset: "nep141:usdc.near",
      destination_asset: "nep141:usdt.near",
      confidential: true,
      settled_at: "2026-11-10T10:00:00.000Z",
      ...details,
    },
    receipt: null,
  }) as ReceiptItem;
const findPair = (asset: string) =>
  asset === "nep141:usdc.near"
    ? { symbol: "USDC", decimals: 6 }
    : asset === "nep141:usdt.near"
      ? { symbol: "USDT", decimals: 6 }
      : undefined;

test("an exact-output receipt shows what it delivers and the most it could spend", () => {
  const exactOut = swapReceipt({ amount_out: "1000000", max_amount_in: "1010000" });
  assert.equal(receiptAmountLabel(exactOut, findPair), "up to 1.01 USDC → 1 USDT");
  assert.deepEqual(receiptTermRows(exactOut, findPair), [
    ["Receives exactly", "1 USDT"],
    ["Spends at most", "1.01 USDC"],
  ]);
});

test("an exact-input receipt copes with no amount_out and shows the minimum and delivery", () => {
  const pending = swapReceipt({ amount: "2000000", min_amount_out: "1900000" });
  assert.equal(receiptAmountLabel(pending, findPair), "2 USDC");
  assert.deepEqual(receiptTermRows(pending, findPair), [["Minimum received", "1.9 USDT"]]);
  const settled = swapReceipt({ amount: "2000000", amount_out: "1950000" });
  assert.equal(receiptAmountLabel(settled, findPair), "2 USDC → 1.95 USDT");
  assert.deepEqual(receiptTermRows(settled, findPair), [["Delivered", "1.95 USDT"]]);
  assert.deepEqual(receiptTermRows(transfer, findPair), []);
});

test("a withdrawal receipt reads exact output in its own units on chain near only", () => {
  const withdraw = (chain: string): ReceiptItem =>
    ({
      correlation_id: `op_${"c".repeat(43)}`,
      type: "withdraw",
      status: "PROVEN",
      details: {
        asset: "nep141:usdc.near",
        recipient: "x",
        chain,
        confidential: true,
        amount_out: "1000000",
        max_amount_in: "1020000",
        settled_at: "2026-11-10T10:00:00.000Z",
      },
      receipt: null,
    }) as ReceiptItem;
  assert.equal(receiptAmountLabel(withdraw("near"), findPair), "up to 1.02 USDC");
  assert.deepEqual(receiptTermRows(withdraw("near"), findPair), [
    ["Receives exactly", "1 USDC"],
    ["Spends at most", "1.02 USDC"],
  ]);
  assert.match(receiptTermRows(withdraw("eth"), findPair)[0]?.[1] ?? "", /atomic units/);
});

test("receipt pins default to production, accept overrides and refuse a plain-HTTP log", () => {
  const defaults = parseReceiptPins({});
  assert.equal(defaults.RECEIPT_LOG_ORIGIN, "api.agentsonintents.com/log");
  assert.equal(defaults.RECEIPT_LOG_URL, "https://log.agentsonintents.com/");
  assert.match(defaults.RECEIPT_WITNESS_KEY, /^[0-9a-f]{64}$/);
  assert.equal(
    parseReceiptPins({ RECEIPT_LOG_ORIGIN: "" }).RECEIPT_LOG_ORIGIN,
    defaults.RECEIPT_LOG_ORIGIN,
  );
  assert.equal(
    parseReceiptPins({ RECEIPT_LOG_URL: "https://log.example.test/" }).RECEIPT_LOG_URL,
    "https://log.example.test/",
  );
  assert.throws(
    () => parseReceiptPins({ RECEIPT_LOG_URL: "http://log.example.test/" }),
    /RECEIPT_LOG_URL/,
  );
  assert.throws(() => parseReceiptPins({ RECEIPT_WITNESS_KEY: "nope" }), /RECEIPT_WITNESS_KEY/);
});

test("reference and note follow the API's limits", () => {
  assert.ok(paymentReferenceSchema.safeParse("inv-42").success);
  assert.ok(!paymentReferenceSchema.safeParse("has space").success);
  assert.ok(!paymentReferenceSchema.safeParse("a".repeat(129)).success);
  assert.ok(executionNoteSchema.safeParse("Paid the March invoice").success);
  assert.ok(!executionNoteSchema.safeParse("two\nlines").success);
  assert.ok(!executionNoteSchema.safeParse("a".repeat(501)).success);
});

test("receipt refusals read in plain language and are not retried", () => {
  for (const code of ["receipt_not_available", "transparency_log_disabled"]) {
    assert.equal(isRetryable(code), false);
    assert.doesNotMatch(errorMessage(code), /Something went wrong/);
  }
});
