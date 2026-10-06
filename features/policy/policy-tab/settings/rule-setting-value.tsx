import type { PolicyView } from "@near-intents-agent-api/sdk";
import type { Rules } from "../../rules/rules";
import type { SummaryCatalog } from "../../rules/summary/summary-types";
import { AbilitySettingValue } from "./ability-setting-value";
import { isBudgetSetting } from "./budget-setting-utils";
import { BudgetSettingValue } from "./budget-setting-value";
import { DestinationsSettingValue } from "./destinations-setting-value";
import { LimitsSettingValue } from "./limits-setting-value";
import { isAbilitySetting, type RuleSettingId } from "./rule-setting-definitions";
import { TokenSettingValue } from "./token-setting-value";

export function RuleSettingValue({
  id,
  rules,
  catalog,
  usage,
}: {
  id: RuleSettingId;
  rules: Rules;
  catalog: SummaryCatalog;
  usage: PolicyView["usage"]["budget"];
}) {
  if (isAbilitySetting(id)) return <AbilitySettingValue ability={id} rules={rules} />;
  if (id === "tokens") return <TokenSettingValue rules={rules} catalog={catalog} />;
  if (id === "limits") return <LimitsSettingValue rules={rules} catalog={catalog} />;
  if (id === "destinations") return <DestinationsSettingValue rules={rules} />;
  if (id === "delay")
    return <span>{rules.delaySeconds === "0" ? "No delay" : `${rules.delaySeconds} seconds`}</span>;
  if (id === "approval")
    return <span>{rules.approval ? "Required for every move" : "Not required"}</span>;
  return isBudgetSetting(id) ? <BudgetSettingValue field={id} rules={rules} usage={usage} /> : null;
}
