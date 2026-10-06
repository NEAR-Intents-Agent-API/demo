import assert from "node:assert/strict";
import { test } from "node:test";
import {
  extractQuote,
  isAtomic,
  labelFor,
  pick,
  quoteEntries,
} from "../../features/funds/model/quote";

const tool = {
  data: { dry: true, type: "swap", quote: { amount_out: "1248", nested: { fee: "3" } } },
};

test("extractQuote unwraps a tool result and a bare response", () => {
  assert.deepEqual(extractQuote(tool), { amount_out: "1248", nested: { fee: "3" } });
  assert.deepEqual(extractQuote({ quote: { a: "1" } }), { a: "1" });
  assert.equal(extractQuote("nope"), null);
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
