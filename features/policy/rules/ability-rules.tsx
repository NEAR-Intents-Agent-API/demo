"use client";

import { AbilityRuleItem } from "./ability-rule-item";
import { ABILITIES, type Ability, type Rules } from "./rules";
import { RulesSection } from "./rules-section";

/** Each permission is one aligned row; related fields stay directly below it. */
export function AbilityRules({
  rules,
  onChange,
}: {
  rules: Rules;
  onChange: (rules: Rules) => void;
}) {
  const toggle = (ability: Ability) =>
    onChange({ ...rules, abilities: { ...rules.abilities, [ability]: !rules.abilities[ability] } });
  const on = ABILITIES.filter((ability) => rules.abilities[ability]).length;
  return (
    <RulesSection
      title="Allowed actions"
      description="Choose what this account and its clients may do."
      aside={
        <span className="rounded-md bg-muted px-2 py-1 text-xs text-muted-foreground tabular-nums">
          {on} / {ABILITIES.length} enabled
        </span>
      }
    >
      <ul className="divide-y">
        {ABILITIES.map((ability) => (
          <li key={ability} className="min-w-0">
            <AbilityRuleItem
              ability={ability}
              on={rules.abilities[ability]}
              onToggle={() => toggle(ability)}
            />
          </li>
        ))}
      </ul>
    </RulesSection>
  );
}
