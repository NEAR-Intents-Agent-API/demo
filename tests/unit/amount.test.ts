import assert from "node:assert/strict";
import { test } from "node:test";
import { formatDisplay, formatUnits, fractionOf, parseUnits } from "../../lib/format/amount";

test("formatUnits trims trailing zeros and keeps 24-decimal precision", () => {
  assert.equal(formatUnits("1250500000", 6), "1250.5");
  assert.equal(formatUnits("42500000000000000000000000", 24), "42.5");
  assert.equal(formatUnits("1", 24), "0.000000000000000000000001");
  assert.equal(formatUnits("7", 0), "7");
});

test("parseUnits is exact and refuses what it would have to round", () => {
  assert.equal(parseUnits("1.5", 6), 1_500_000n);
  assert.equal(parseUnits("1,250.50", 6), 1_250_500_000n);
  assert.equal(parseUnits(".5", 2), 50n);
  assert.equal(parseUnits("0.1234567", 6), null);
  assert.equal(parseUnits("", 6), null);
  assert.equal(parseUnits(".", 6), null);
  assert.equal(parseUnits("1e5", 6), null);
  assert.equal(parseUnits("-1", 6), null);
});

test("parseUnits and formatUnits round-trip", () => {
  for (const [text, decimals] of [
    ["0.000001", 6],
    ["123456789.123456789123456789", 18],
    ["1", 24],
  ] as const) {
    assert.equal(formatUnits((parseUnits(text, decimals) ?? 0n).toString(), decimals), text);
  }
});

test("formatDisplay groups thousands and never shows dust as zero", () => {
  assert.equal(formatDisplay("1250500000", 6), "1,250.5");
  assert.equal(formatDisplay("1234567890000", 6), "1,234,567.89");
  assert.equal(formatDisplay("5", 18), "<0.000001");
  assert.equal(formatDisplay("0", 6), "0");
  assert.equal(formatDisplay("123", null), "123");
});

test("fractionOf takes basis points of an amount", () => {
  assert.equal(fractionOf(1_000_000n, 9_900), 990_000n);
  assert.equal(fractionOf(1_000_000n, 10_000), 1_000_000n);
});
