export const BUDGET_WINDOWS = [
  { key: "daily", field: "dailyUsd", label: "Per 24 hours" },
  { key: "weekly", field: "weeklyUsd", label: "Per 7 days" },
  { key: "monthly", field: "monthlyUsd", label: "Per 30 days" },
] as const;

/**
 * `"1.004000"` → `"1.01"` rounding up, `"1.00"` rounding down. Usage rounds up and allowance
 * down, so a display never understates what was counted or overstates what is left.
 */
export function cents(usd: string, round: "up" | "down" = "up"): string {
  const [whole = "0", fraction = ""] = usd.split(".");
  const micros = BigInt(whole) * 1_000_000n + BigInt(fraction.padEnd(6, "0").slice(0, 6));
  const total = (micros + (round === "up" ? 9_999n : 0n)) / 10_000n;
  return `${total / 100n}.${String(total % 100n).padStart(2, "0")}`;
}
