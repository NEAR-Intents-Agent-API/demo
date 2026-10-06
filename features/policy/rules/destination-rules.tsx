"use client";

import { DESTINATION_RULE_COPY, DestinationRuleFields } from "@/features/funds";
import type { Rules } from "./rules";
import { RulesSection } from "./rules-section";

/** One destination rule applies to the dashboard and every connected client. */
export function DestinationRules({
  rules,
  onChange,
  embedded = false,
}: {
  rules: Rules;
  onChange: (rules: Rules) => void;
  embedded?: boolean;
}) {
  return (
    <RulesSection
      embedded={embedded}
      title="Destinations"
      description={DESTINATION_RULE_COPY[rules.destinations.mode]}
    >
      <DestinationRuleFields
        value={rules.destinations}
        onChange={(destinations) => onChange({ ...rules, destinations })}
      />
      <p className="max-w-2xl text-xs leading-5 text-muted-foreground">
        Swaps, shield and unshield stay within this account. This rule applies to the dashboard and
        every connected client; changing it does not require a new grant.
      </p>
    </RulesSection>
  );
}
