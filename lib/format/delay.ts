/** The longest execution delay the API accepts, in seconds. */
export const MAX_DELAY_SECONDS = 30 * 24 * 60 * 60;

/** The units an owner types an execution delay in; the rules model keeps seconds. */
export const DELAY_UNITS = [
  { id: "minutes", label: "minutes", seconds: 60 },
  { id: "hours", label: "hours", seconds: 60 * 60 },
  { id: "days", label: "days", seconds: 24 * 60 * 60 },
] as const;
export type DelayUnit = (typeof DELAY_UNITS)[number]["id"];

const unitSeconds = (unit: DelayUnit) =>
  DELAY_UNITS.find((item) => item.id === unit)?.seconds ?? 60;

/** Seconds as typed → the largest unit that shows them as a whole number (minutes otherwise). */
export function delayInput(delaySeconds: string): { amount: string; unit: DelayUnit } {
  const seconds = Number(delaySeconds);
  if (!delaySeconds.trim() || !Number.isFinite(seconds) || seconds <= 0)
    return { amount: delaySeconds === "0" ? "0" : "", unit: "minutes" };
  for (const unit of [...DELAY_UNITS].reverse())
    if (seconds % unit.seconds === 0)
      return { amount: String(seconds / unit.seconds), unit: unit.id };
  return { amount: String(seconds / 60), unit: "minutes" };
}

/** An amount in a unit → the rules model's seconds. Anything that is not a number stays `NaN`. */
export function delaySecondsFrom(amount: string, unit: DelayUnit): string {
  if (!amount.trim()) return "0";
  const value = Number(amount);
  return Number.isFinite(value)
    ? String(Math.round(value * unitSeconds(unit) * 1000) / 1000)
    : "NaN";
}

/** An execution delay for display, in the units people think in: "5 minutes", "1 hour 30 minutes". */
export function formatDelayMs(delayMs: number): string {
  if (!Number.isFinite(delayMs)) return "Not a valid delay";
  if (delayMs === 0) return "No delay";
  const parts: string[] = [];
  let rest = delayMs;
  for (const [ms, singular, plural] of [
    [86_400_000, "day", "days"],
    [3_600_000, "hour", "hours"],
    [60_000, "minute", "minutes"],
    [1_000, "second", "seconds"],
  ] as const) {
    const count = Math.floor(rest / ms);
    if (count > 0) parts.push(`${count} ${count === 1 ? singular : plural}`);
    rest -= count * ms;
  }
  // Sub-second remainders are not offered by the editor but the API stores milliseconds.
  if (rest > 0) parts.push(`${rest} ms`);
  return parts.join(" ");
}
