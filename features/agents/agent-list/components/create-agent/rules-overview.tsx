"use client";

import { useCatalog } from "@/features/assets";
import { DestinationsLine, LimitsLine, NativeLine, TokensLine } from "@/features/policy";
import { ABILITIES, ABILITY_INFO, describeSchedule, type Rules } from "@/features/policy/model";
import { formatDelayMs } from "@/lib/format/delay";
import { RulesOverviewRow } from "./rules-overview-row";

const MONEY_ACTIONS = ABILITIES.filter((ability) => ability !== "confidential");

/**
 * Every rule an activation signature installs, in plain words, with nothing hidden behind the
 * editor. A passkey prompt cannot show any of this, so this is the owner's one chance to read it.
 */
export function RulesOverview({ rules }: { rules: Rules }) {
  const catalog = useCatalog();
  const actions = MONEY_ACTIONS.filter((ability) => rules.abilities[ability]);
  const capped = [
    { value: rules.budget.dailyUsd, period: "rolling 24 hours" },
    { value: rules.budget.weeklyUsd, period: "rolling 7 days" },
    { value: rules.budget.monthlyUsd, period: "rolling 30 days" },
  ].filter(({ value }) => value.trim());
  return (
    <dl className="divide-y divide-border rounded-lg border border-border px-4">
      <RulesOverviewRow label="Allowed actions">
        {actions.length ? (
          <ul className="flex flex-wrap gap-x-5 gap-y-2">
            {actions.map((ability) => (
              <li key={ability} className="text-xs font-medium leading-4 text-primary">
                {ABILITY_INFO[ability].title}
              </li>
            ))}
          </ul>
        ) : (
          "None"
        )}
      </RulesOverviewRow>
      <RulesOverviewRow label="Private balance">
        {rules.abilities.confidential
          ? "On: funds can be held and moved in the private balance"
          : "Off: the private balance cannot be used"}
      </RulesOverviewRow>
      <RulesOverviewRow label="Tokens">
        <div className="flex flex-wrap items-center gap-x-4 gap-y-1">
          {rules.tokens === "any" ? "Any token NEAR Intents supports" : null}
          {rules.tokens !== "any" && rules.tokens.length === 0 ? "None" : null}
          {rules.tokens !== "any" ? <TokensLine rules={rules} catalog={catalog} /> : null}
        </div>
      </RulesOverviewRow>
      <RulesOverviewRow label="Per-token caps per move">
        <div className="flex flex-wrap items-center gap-2">
          <LimitsLine rules={rules} catalog={catalog} hideRate />
        </div>
      </RulesOverviewRow>
      <RulesOverviewRow label="Moves per hour">
        {rules.maxPerHour.trim() ? `At most ${rules.maxPerHour}` : "No cap"}
      </RulesOverviewRow>
      <RulesOverviewRow label="Destinations">
        <DestinationsLine rules={rules} />
      </RulesOverviewRow>
      <RulesOverviewRow label="Spending limits">
        {capped.length
          ? capped.map(({ value, period }) => `$${value} per ${period}`).join(", ")
          : "No USD spending caps"}
      </RulesOverviewRow>
      <RulesOverviewRow label="Execution delay">
        {formatDelayMs(Math.round(Number(rules.delaySeconds) * 1000))}
      </RulesOverviewRow>
      <RulesOverviewRow label="Schedule">{describeSchedule(rules.schedule)}</RulesOverviewRow>
      <RulesOverviewRow label="Owner approval">
        {rules.approval
          ? "Every swap, transfer and withdrawal waits for your approval"
          : "Not required: clients act on their own within these rules"}
      </RulesOverviewRow>
      <RulesOverviewRow label="Native accounts">
        <NativeLine native={rules.native} />
      </RulesOverviewRow>
    </dl>
  );
}
