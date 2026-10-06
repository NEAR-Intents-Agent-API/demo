import { DestinationsLine } from "@/features/policy";
import { ABILITIES, ABILITY_INFO, type Rules } from "@/features/policy/model";
import { RulesOverviewRow } from "./rules-overview-row";

/**
 * The starting rules in plain words, before anyone opens the editor. It exists so the first
 * screen of creation answers "what am I signing?" without showing a single control.
 */
export function RulesOverview({ rules }: { rules: Rules }) {
  const abilities = ABILITIES.filter((ability) => rules.abilities[ability]);
  const capped = [
    { value: rules.budget.dailyUsd, period: "day" },
    { value: rules.budget.weeklyUsd, period: "week" },
    { value: rules.budget.monthlyUsd, period: "month" },
  ].filter(({ value }) => value.trim());
  return (
    <dl className="divide-y divide-border rounded-lg border border-border px-4">
      <RulesOverviewRow label="Allowed actions">
        {abilities.length ? (
          <ul className="flex flex-wrap gap-x-5 gap-y-2">
            {abilities.map((ability) => (
              <li key={ability} className="text-xs font-medium leading-4 text-primary">
                {ABILITY_INFO[ability].title}
              </li>
            ))}
          </ul>
        ) : (
          "None"
        )}
      </RulesOverviewRow>
      <RulesOverviewRow label="Tokens">
        {rules.tokens === "any"
          ? "Any token NEAR Intents supports"
          : `${rules.tokens.length} chosen token${rules.tokens.length === 1 ? "" : "s"}`}
      </RulesOverviewRow>
      <RulesOverviewRow label="Destinations">
        <DestinationsLine rules={rules} />
      </RulesOverviewRow>
      <RulesOverviewRow label="Spending limits">
        {capped.length
          ? capped.map(({ value, period }) => `$${value} per ${period}`).join(" · ")
          : "No USD spending caps"}
      </RulesOverviewRow>
      <RulesOverviewRow label="Execution delay">
        {Number(rules.delaySeconds) > 0 ? `${rules.delaySeconds} seconds` : "No delay"}
      </RulesOverviewRow>
    </dl>
  );
}
