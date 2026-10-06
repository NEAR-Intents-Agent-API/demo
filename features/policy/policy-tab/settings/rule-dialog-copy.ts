import { BUDGET_SETTINGS, isBudgetSetting } from "./budget-setting-utils";
import type { RuleSettingId } from "./rule-setting-definitions";

export function ruleDialogDescription(id: RuleSettingId): string {
  if (isBudgetSetting(id))
    return `Limit USD spending across the last ${BUDGET_SETTINGS[id].label}.`;
  switch (id) {
    case "limits":
      return "Limit each token per move and the number of moves per hour.";
    case "tokens":
      return "Choose tokens this account may swap, transfer or withdraw.";
    case "delay":
      return "Set how long an accepted execution must wait.";
    case "destinations":
      return "Choose where transfers and withdrawals may go.";
    default:
      return "Changes apply to this account and every connected client.";
  }
}
