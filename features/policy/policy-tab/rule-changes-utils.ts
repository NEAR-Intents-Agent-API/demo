import type { Rules } from "../rules/rules";
import { isBudgetSetting } from "./settings/budget-setting-utils";
import {
  isAbilitySetting,
  RULE_SETTING_GROUPS,
  type RuleSettingId,
} from "./settings/rule-setting-definitions";

function settingValue(rules: Rules, id: RuleSettingId): unknown {
  if (isAbilitySetting(id)) return rules.abilities[id];
  if (isBudgetSetting(id)) return rules.budget[id];
  if (id === "limits") return [rules.limits, rules.maxPerHour];
  if (id === "delay") return rules.delaySeconds;
  return rules[id];
}

/** Compare actual draft values, so returning a field to its original value clears it. */
export function changedRuleSettings(current: Rules, draft: Rules) {
  return RULE_SETTING_GROUPS.flatMap((group) => group.rows).filter(
    ({ id }) =>
      JSON.stringify(settingValue(current, id)) !== JSON.stringify(settingValue(draft, id)),
  );
}
