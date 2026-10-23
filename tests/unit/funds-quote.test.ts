import assert from "node:assert/strict";
import { test } from "node:test";
import {
  extractQuote,
  extractSwapPreview,
  extractWarnings,
  extractWithdrawPreview,
  isAtomic,
  labelFor,
  pick,
  quoteEntries,
} from "../../features/funds/model/quote";
import { warningMessage } from "../../features/funds/model/quote-warnings";

const tool = {
  data: { dry: true, type: "swap", quote: { amount_out: "1248", nested: { fee: "3" } } },
};

test("extractQuote unwraps a tool result and a bare response", () => {
  assert.deepEqual(extractQuote(tool), { amount_out: "1248", nested: { fee: "3" } });
  assert.deepEqual(extractQuote({ quote: { a: "1" } }), { a: "1" });
  assert.equal(extractQuote("nope"), null);
});

test("extractWithdrawPreview keeps the API's top-level fee next to the quote", () => {
  const fee = { amount_usd: "0.25", percent: "0.5" };
  const quote = { amount_out: "995000", fee_amount: "5000" };
  assert.deepEqual(
    extractWithdrawPreview({ data: { dry: true, type: "withdraw", quote, fee, warnings: [] } }),
    { quote, fee, warnings: [] },
  );
  assert.deepEqual(extractWithdrawPreview({ quote, fee: null }), {
    quote,
    fee: null,
    warnings: [],
  });
  assert.deepEqual(extractWithdrawPreview({ quote }), { quote, fee: null, warnings: [] });
  // A malformed fee is dropped, never half-read.
  assert.deepEqual(extractWithdrawPreview({ quote, fee: { amount_usd: "0.25" } }).fee, null);
  assert.deepEqual(
    extractWithdrawPreview({ quote, fee: { amount_usd: 1, percent: "1" } }).fee,
    null,
  );
  assert.deepEqual(
    extractWithdrawPreview({ quote, fee: { amount_usd: "x", percent: "1" } }).fee,
    null,
  );
  assert.deepEqual(extractWithdrawPreview("nope"), { quote: null, fee: null, warnings: [] });
});

test("pick reads a key one object level down and ignores empty values", () => {
  const quote = extractQuote(tool);
  assert.equal(pick(quote, ["amount_out"]), "1248");
  assert.equal(pick(quote, ["fee"]), "3");
  assert.equal(pick(quote, ["missing"]), null);
  assert.equal(pick({ a: "" }, ["a"]), null);
  assert.equal(pick({ a: 4 }, ["a"]), "4");
});

test("isAtomic only accepts integers a BigInt can hold", () => {
  assert.equal(isAtomic("123"), true);
  assert.equal(isAtomic("1.5"), false);
  assert.equal(isAtomic(null), false);
});

test("quoteEntries flattens scalars and labelFor reads snake_case", () => {
  assert.deepEqual(quoteEntries({ a: "1", b: { c: true } }), [
    ["a", "1"],
    ["b.c", "true"],
  ]);
  assert.equal(labelFor("quote.amount_out_usd"), "Amount out usd");
});

test("warnings keep their code and the spendable amount, and drop malformed entries", () => {
  const warnings = [
    { code: "policy_action_denied", detail: "Provider text that is never kept." },
    { code: "insufficient_balance", detail: "x", available_amount: "250000" },
    { code: "insufficient_balance", detail: "x", available_amount: "1.5" },
    { code: "Not A Code" },
    { detail: "no code" },
    "nope",
  ];
  const expected = [
    { code: "policy_action_denied" },
    { code: "insufficient_balance", availableAmount: "250000" },
    { code: "insufficient_balance" },
  ];
  assert.deepEqual(extractWarnings({ data: { quote: {}, warnings } }), expected);
  assert.deepEqual(extractWarnings({ quote: {}, warnings }), expected);
  assert.deepEqual(extractWarnings({ quote: {} }), []);
  assert.deepEqual(extractWarnings("nope"), []);
  assert.deepEqual(extractSwapPreview({ data: { quote: { amount_out: "1" }, warnings } }), {
    quote: { amount_out: "1" },
    warnings: expected,
  });
  assert.deepEqual(
    extractWithdrawPreview({ quote: { amount_out: "1" }, warnings }).warnings,
    expected,
  );
});

test("every dry-run warning code reads as a sentence, never as the raw code", () => {
  const token = { symbol: "USDC", decimals: 6 };
  for (const code of [
    "policy_action_denied",
    "policy_destination_denied",
    "policy_asset_denied",
    "policy_schedule_denied",
    "unsupported_token",
    "invalid_address",
    "insufficient_balance",
    "spend_budget_exceeded",
    "policy_limit_exceeded",
    "high_fee",
    "asset_delivered_as_is",
  ])
    assert.doesNotMatch(warningMessage({ code }, token), /^Something went wrong/, code);
  assert.match(
    warningMessage({ code: "insufficient_balance", availableAmount: "250000" }, token),
    /Only 0\.25 USDC is available/,
  );
  assert.match(warningMessage({ code: "insufficient_balance" }, token), /does not have enough/);
});
