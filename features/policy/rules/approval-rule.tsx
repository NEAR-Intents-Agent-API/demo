"use client";

import { Switch } from "@/components/ui/switch";
import type { Rules } from "./rules";
import { RulesSection } from "./rules-section";

/** The provider holds every swap, transfer and withdrawal until you approve it in Activity. */
export function ApprovalRule({
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
      title="Owner approval"
      description="Hold moves for your approval in Activity. Spending limits still apply."
    >
      <Switch
        checked={rules.approval}
        onChange={(approval) => onChange({ ...rules, approval })}
        label="Ask me to approve every move"
        description={
          rules.approval
            ? "Nothing leaves the account without your signature."
            : "Clients act on their own within these rules."
        }
      />
    </RulesSection>
  );
}
