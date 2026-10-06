import type { Rules } from "./rules/rules";

/** The account-wide spending caps and delay every grant draws on. */
export function GrantSharedControls({ rules }: { rules: Rules }) {
  const caps = [
    ["a day", rules.budget.dailyUsd],
    ["a week", rules.budget.weeklyUsd],
    ["a month", rules.budget.monthlyUsd],
  ].filter(([, value]) => value);
  const delay = Number(rules.delaySeconds);
  return (
    <p className="text-xs leading-5 text-muted-foreground">
      {caps.length
        ? `Shared budget: at most ${caps.map(([period, usd]) => `$${usd} ${period}`).join(", ")} across every grant.`
        : "No shared USD budget."}{" "}
      {delay > 0 ? `Every move waits ${delay} seconds before it runs.` : "Moves run right away."}
    </p>
  );
}
