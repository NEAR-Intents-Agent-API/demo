import type { ComponentProps } from "react";
import { isBudgetSetting } from "./settings/budget-setting-utils";
import { RuleSettingValue } from "./settings/rule-setting-value";

export function RuleChangeValue(props: ComponentProps<typeof RuleSettingValue>) {
  const { id, rules } = props;
  if (isBudgetSetting(id)) {
    return <span>{rules.budget[id].trim() ? `$${rules.budget[id]} cap` : "No cap"}</span>;
  }
  return (
    <div className="space-y-1">
      <div className="flex flex-wrap items-center gap-1">
        <RuleSettingValue {...props} />
      </div>
    </div>
  );
}
