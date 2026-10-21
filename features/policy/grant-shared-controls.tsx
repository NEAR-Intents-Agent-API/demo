import { formatDelayMs } from "@/lib/format/delay";
import type { Rules } from "./rules/rules";

/** The account-wide spending caps and delay every grant draws on. */
export function GrantSharedControls({ rules }: { rules: Rules }) {
  const caps = [
    ["per day", rules.budget.dailyUsd],
    ["per week", rules.budget.weeklyUsd],
    ["per month", rules.budget.monthlyUsd],
  ].filter(([, value]) => value);
  const delayMs = Math.round(Number(rules.delaySeconds) * 1000);
  return (
    <p className="text-xs leading-5 text-muted-foreground">
      {caps.length
        ? `Shared budget: at most ${caps.map(([period, usd]) => `$${usd} ${period}`).join(", ")} across every grant.`
        : "No shared USD budget."}{" "}
      {delayMs > 0
        ? `Every swap, transfer and withdrawal waits ${formatDelayMs(delayMs)} before it runs.`
        : "Moves run right away."}
    </p>
  );
}
