"use client";

import { BudgetFields } from "./budget-fields";
import { DelayField } from "./delay-field";
import type { Rules } from "./rules";
import { RulesSection } from "./rules-section";

/** Shared by creation and every complete rules edit; no separate signing controls. */
export function PolicyControlsFields({
  rules,
  onChange,
}: {
  rules: Rules;
  onChange: (rules: Rules) => void;
}) {
  return (
    <RulesSection
      title="Budget and execution delay"
      description="USD caps apply across all clients. Leave caps empty for no limit."
    >
      <BudgetFields rules={rules} onChange={onChange} />
      <div className="border-t pt-3">
        <DelayField rules={rules} onChange={onChange} />
      </div>
    </RulesSection>
  );
}
