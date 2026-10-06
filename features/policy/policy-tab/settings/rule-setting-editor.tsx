import { ApprovalRule } from "../../rules/approval-rule";
import { BudgetFields } from "../../rules/budget-fields";
import { DelayField } from "../../rules/delay-field";
import { DestinationRules } from "../../rules/destination-rules";
import { LimitRules } from "../../rules/limit-rules";
import type { Rules } from "../../rules/rules";
import type { SummaryCatalog } from "../../rules/summary/summary-types";
import { TokenRules } from "../../rules/token-rules";
import { AbilitySettingEditor } from "./ability-setting-editor";
import { isBudgetSetting } from "./budget-setting-utils";
import { isAbilitySetting, type RuleSettingId } from "./rule-setting-definitions";

export function RuleSettingEditor({
  id,
  rules,
  onChange,
  catalog,
  disabled,
}: {
  id: RuleSettingId;
  rules: Rules;
  onChange: (rules: Rules) => void;
  catalog: SummaryCatalog;
  disabled: boolean;
}) {
  let fields: React.ReactNode;
  if (isAbilitySetting(id))
    fields = <AbilitySettingEditor ability={id} rules={rules} onChange={onChange} />;
  else if (id === "tokens")
    fields = <TokenRules embedded rules={rules} onChange={onChange} catalog={catalog} />;
  else if (id === "limits")
    fields = <LimitRules embedded rules={rules} onChange={onChange} catalog={catalog} />;
  else if (isBudgetSetting(id))
    fields = <BudgetFields field={id} rules={rules} onChange={onChange} />;
  else if (id === "delay") fields = <DelayField rules={rules} onChange={onChange} />;
  else if (id === "destinations")
    fields = <DestinationRules embedded rules={rules} onChange={onChange} />;
  else fields = <ApprovalRule embedded rules={rules} onChange={onChange} />;

  return (
    <fieldset
      disabled={disabled}
      className="min-w-0 [&>section]:border-0 [&>section]:bg-transparent [&>section]:p-0"
    >
      {fields}
    </fieldset>
  );
}
