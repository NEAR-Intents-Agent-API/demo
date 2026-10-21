import { ABILITY_INFO } from "../../rules/abilities";
import { NATIVE_WARNING } from "../../rules/native";
import { ABILITIES, type Ability } from "../../rules/rules";
import type { BudgetSettingId } from "./budget-setting-utils";

export type RuleSettingId =
  | Ability
  | "tokens"
  | "limits"
  | BudgetSettingId
  | "delay"
  | "schedule"
  | "destinations"
  | "approval"
  | "native";
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
        title: "Daily budget",
        description:
          "USD cap per day, counted from when it was turned on. Resets in full each day.",
      },
      {
        id: "weeklyUsd",
        title: "Weekly budget",
        description:
          "USD cap per week, counted from when it was turned on. Resets in full each week.",
      },
      {
        id: "monthlyUsd",
        title: "Monthly budget",
        description:
          "USD cap per calendar month, counted from when it was turned on. Resets in full each month.",
      },
      {
        id: "delay",
        title: "Execution delay",
        description:
          "How long every swap, transfer and withdrawal waits before it runs. You can cancel while it waits. Deposits are not delayed.",
      },
      {
        id: "schedule",
        title: "Schedule",
        description: "Hours on your clock when money actions may run. Deposits are never held.",
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
  {
    title: "Native accounts",
    description:
      "The agent's own NEAR, EVM and Solana keys outside NEAR Intents. None of the rules above applies to them.",
    rows: [
      {
        id: "native",
        title: "Native accounts",
        description: NATIVE_WARNING,
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
