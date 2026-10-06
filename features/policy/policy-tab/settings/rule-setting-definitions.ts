import { ABILITY_INFO } from "../../rules/abilities";
import { ABILITIES, type Ability } from "../../rules/rules";
import type { BudgetSettingId } from "./budget-setting-utils";

export type RuleSettingId =
  | Ability
  | "tokens"
  | "limits"
  | BudgetSettingId
  | "delay"
  | "destinations"
  | "approval";
export type RuleSetting = { id: RuleSettingId; title: string; description: string };

export const RULE_SETTING_GROUPS: readonly {
  title: string;
  description: string;
  rows: readonly RuleSetting[];
}[] = [
  {
    title: "Permissions",
    description: "Choose allowed actions and tokens for this account.",
    rows: [
      ...ABILITIES.map((id) => ({
        id,
        title: ABILITY_INFO[id].title,
        description: ABILITY_INFO[id].description,
      })),
      {
        id: "tokens",
        title: "Allowed tokens",
        description: "Tokens this account may swap, transfer or withdraw.",
      },
    ],
  },
  {
    title: "Spending & timing",
    description: "Limits apply across the dashboard and every connected client.",
    rows: [
      {
        id: "limits",
        title: "Per-move limits",
        description: "Token caps and the maximum number of moves per hour.",
      },
      {
        id: "dailyUsd",
        title: "24-hour budget",
        description: "USD cap over a rolling 24-hour window. Changes preserve counted usage.",
      },
      {
        id: "weeklyUsd",
        title: "7-day budget",
        description: "USD cap over a rolling 7-day window. Changes preserve counted usage.",
      },
      {
        id: "monthlyUsd",
        title: "30-day budget",
        description: "USD cap over a rolling 30-day window. Changes preserve counted usage.",
      },
      {
        id: "delay",
        title: "Execution delay",
        description: "Waiting time after API acceptance, before an execution may proceed.",
      },
    ],
  },
  {
    title: "Destinations & approvals",
    description: "Control where funds may go and when your signature is required.",
    rows: [
      {
        id: "destinations",
        title: "Destinations",
        description: "Destination rules for transfers and withdrawals, shared by every grant.",
      },
      {
        id: "approval",
        title: "Owner approval",
        description:
          "Hold swaps, transfers and withdrawals for approval in Activity. Limits still apply.",
      },
    ],
  },
];

export function isAbilitySetting(id: RuleSettingId): id is Ability {
  return (ABILITIES as readonly string[]).includes(id);
}

export type ToggleSettingId = Ability | "approval";

export function isToggleSetting(id: RuleSettingId): id is ToggleSettingId {
  return id === "approval" || isAbilitySetting(id);
}
