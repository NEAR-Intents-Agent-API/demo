import type { Rules } from "../../rules/rules";

export type BudgetSettingId = keyof Rules["budget"];

export const BUDGET_SETTINGS = {
  dailyUsd: { window: "daily", label: "day" },
  weeklyUsd: { window: "weekly", label: "week" },
  monthlyUsd: { window: "monthly", label: "month" },
} as const;

export function isBudgetSetting(id: string): id is BudgetSettingId {
  return Object.hasOwn(BUDGET_SETTINGS, id);
}
