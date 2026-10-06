import type { PolicyView } from "@near-intents-agent-api/sdk";
import type { Rules } from "../../rules/rules";
import { cents } from "../budget-utils";
import { BUDGET_SETTINGS, type BudgetSettingId } from "./budget-setting-utils";

export function BudgetSettingValue({
  field,
  rules,
  usage,
}: {
  field: BudgetSettingId;
  rules: Rules;
  usage: PolicyView["usage"]["budget"];
}) {
  const window = usage[BUDGET_SETTINGS[field].window];
  return (
    <div className="space-y-1 tabular-nums">
      <p className="text-sm">
        {rules.budget[field].trim() ? `$${rules.budget[field]} cap` : "No cap"}
      </p>
      <p className="text-xs text-muted-foreground">
        ${cents(window.spent_usd)} counted
        {window.limit_usd !== null ? ` · $${cents(window.remaining_usd ?? "0", "down")} left` : ""}
      </p>
    </div>
  );
}
