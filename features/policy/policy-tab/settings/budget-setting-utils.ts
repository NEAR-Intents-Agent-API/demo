import type { Rules } from "../../rules/rules";

export type BudgetSettingId = keyof Rules["budget"];

export const BUDGET_SETTINGS = {
  dailyUsd: { window: "daily", label: "24 hours" },
  weeklyUsd: { window: "weekly", label: "7 days" },
  monthlyUsd: { window: "monthly", label: "30 days" },
} as const;

export function isBudgetSetting(id: string): id is BudgetSettingId {
  return Object.hasOwn(BUDGET_SETTINGS, id);
}
