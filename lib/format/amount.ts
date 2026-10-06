/**
 * Atomic-unit arithmetic for token amounts.
 *
 * The API speaks integers in the token's smallest unit; people speak decimals. Everything here
 * goes through BigInt so a 24-decimal NEAR balance never passes through a float.
 */

/** Renders a raw integer amount with its decimals, trimming trailing zeros. Unknown decimals stay raw. */
export function formatUnits(raw: string, decimals: number): string {
  if (decimals <= 0) return raw;
  const value = BigInt(raw);
  const divisor = 10n ** BigInt(decimals);
  const whole = value / divisor;
  const fraction = (value % divisor).toString().padStart(decimals, "0").replace(/0+$/, "");
  return fraction ? `${whole}.${fraction}` : whole.toString();
}

/**
 * Parses what a person typed into atomic units.
 *
 * Returns null for anything that is not a plain non-negative decimal or that has more fractional
 * digits than the token can represent — rounding a user's amount silently is how funds go to
 * the wrong place.
 */
export function parseUnits(text: string, decimals: number): bigint | null {
  const trimmed = text.trim().replaceAll(",", "");
  if (!/^\d*\.?\d*$/.test(trimmed) || trimmed === "" || trimmed === ".") return null;
  const [whole = "0", fraction = ""] = trimmed.split(".");
  if (fraction.length > decimals) return null;
  return BigInt((whole || "0") + fraction.padEnd(decimals, "0"));
}

/**
 * Compact human display: thousands separators, at most `maxFraction` digits, never `0` for a
 * non-zero balance (dust shows as `<0.000001`).
 */
export function formatDisplay(raw: string, decimals: number | null, maxFraction = 6): string {
  if (decimals === null) return raw;
  const exact = formatUnits(raw, decimals);
  const [whole = "0", fraction = ""] = exact.split(".");
  const grouped = whole.replace(/\B(?=(\d{3})+(?!\d))/g, ",");
  if (!fraction) return grouped;
  const trimmed = fraction.slice(0, maxFraction).replace(/0+$/, "");
  if (!trimmed) return whole === "0" ? `<0.${"0".repeat(maxFraction - 1)}1` : grouped;
  return `${grouped}.${trimmed}`;
}

/** Multiplies a raw amount by a percentage in basis points (10_000 = 100%). */
export function fractionOf(raw: bigint, basisPoints: number): bigint {
  return (raw * BigInt(basisPoints)) / 10_000n;
}
