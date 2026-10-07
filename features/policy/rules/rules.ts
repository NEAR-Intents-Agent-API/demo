import type { DestinationRule, Policy, Schedule } from "@near-intents-agent-api/sdk";
import { defaultDestinationRule, policySchema } from "@/lib/agent-api/schemas";

/**
 * The agent's rules in the owner's words, and their translation to the API policy.
 *
 * The API's policy is already written for owners, so this is a thin mapping: the editor keeps
 * form-friendly values (typed strings, a list of per-token caps, seconds for the delay) and
 * `policyFromRules` turns them into the one complete policy that means exactly that. The server
 * compiles the policy to the custody provider; nothing provider-specific lives here.
 */

export const ABILITIES = ["swap", "transfer", "withdraw", "confidential"] as const;
export type Ability = (typeof ABILITIES)[number];

/** The policy action behind each ability; `confidential` is a separate policy switch. */
type PolicyAction = Policy["actions"][number];
const ACTION_ABILITIES: readonly PolicyAction[] = ["swap", "transfer", "withdraw"];

/** Rules for one token: the most a single move may spend, in the token's smallest unit. */
export type TokenLimit = { assetId: string; perTransaction: string };

export type Rules = {
  abilities: Record<Ability, boolean>;
  /** `"any"`, or the exact asset ids the agent may touch. */
  tokens: "any" | string[];
  limits: TokenLimit[];
  /** Most money actions per hour, as typed; empty means no cap. */
  maxPerHour: string;
  /** The account's one destination rule, shared by the dashboard and every client. */
  destinations: DestinationRule;
  /** Every money action waits for the owner's approval. NEAR owners only. */
  approval: boolean;
  frozen: boolean;
  budget: { dailyUsd: string; weeklyUsd: string; monthlyUsd: string };
  /** The execution delay as typed, in seconds; stored in milliseconds. */
  delaySeconds: string;
  /** When money actions may run, on the owner's clock; `null` means any time. */
  schedule: Schedule | null;
};

/**
 * A new agent can do everything NEAR Intents offers inside the account; nothing leaves it until
 * the owner approves a destination.
 */
export const defaultRules: Rules = {
  abilities: { swap: true, transfer: true, withdraw: true, confidential: true },
  tokens: "any",
  limits: [],
  maxPerHour: "",
  destinations: defaultDestinationRule,
  approval: false,
  frozen: false,
  budget: { dailyUsd: "", weeklyUsd: "", monthlyUsd: "" },
  delaySeconds: "0",
  schedule: null,
};

export function rulesFromPolicy(policy: Policy | null): Rules {
  if (!policy) return structuredClone(defaultRules);
  return {
    abilities: {
      swap: policy.actions.includes("swap"),
      transfer: policy.actions.includes("transfer"),
      withdraw: policy.actions.includes("withdraw"),
      confidential: policy.confidential,
    },
    tokens: policy.assets === "any" ? "any" : [...new Set(policy.assets)],
    limits: Object.entries(policy.limits.per_transaction ?? {}).map(
      ([assetId, perTransaction]) => ({ assetId, perTransaction }),
    ),
    maxPerHour: policy.max_actions_per_hour?.toString() ?? "",
    destinations: structuredClone(policy.destinations),
    approval: policy.owner_approval,
    frozen: policy.frozen,
    budget: {
      dailyUsd: policy.budget.daily_usd ?? "",
      weeklyUsd: policy.budget.weekly_usd ?? "",
      monthlyUsd: policy.budget.monthly_usd ?? "",
    },
    delaySeconds: String(policy.timelock_ms / 1000),
    schedule: policy.schedule ? structuredClone(policy.schedule) : null,
  };
}

/**
 * The complete policy for these rules. Anything the editor does not expose (the hourly, daily
 * and monthly per-token buckets) is carried over from `current` untouched.
 */
export function policyFromRules(current: Policy | null, rules: Rules): Policy {
  const { abilities } = rules;
  return {
    frozen: rules.frozen,
    actions: ACTION_ABILITIES.filter((ability) => abilities[ability]),
    confidential: abilities.confidential,
    owner_approval: rules.approval,
    assets: rules.tokens === "any" ? "any" : [...rules.tokens],
    limits: limitsFromRules(current, rules),
    max_actions_per_hour: maxPerHourFromRules(rules),
    destinations: rules.destinations,
    budget: budgetFromRules(rules),
    timelock_ms: delayMsFromRules(rules),
    ...(rules.schedule ? { schedule: rules.schedule } : {}),
  };
}

function limitsFromRules(current: Policy | null, rules: Rules): Policy["limits"] {
  const limits = { ...current?.limits };
  const perTransaction: Record<string, string> = {};
  for (const limit of rules.limits) {
    if (!/^[1-9][0-9]*$/.test(limit.perTransaction)) continue;
    perTransaction[limit.assetId] = limit.perTransaction;
  }
  if (Object.keys(perTransaction).length) limits.per_transaction = perTransaction;
  else delete limits.per_transaction;
  return limits;
}

function maxPerHourFromRules(rules: Rules): number | null {
  const perHour = Number(rules.maxPerHour);
  return rules.maxPerHour.trim() && Number.isInteger(perHour) && perHour > 0 ? perHour : null;
}

function budgetFromRules(rules: Rules): Policy["budget"] {
  return {
    daily_usd: rules.budget.dailyUsd.trim() || null,
    weekly_usd: rules.budget.weeklyUsd.trim() || null,
    monthly_usd: rules.budget.monthlyUsd.trim() || null,
  };
}

/** The typed seconds as exact milliseconds; `NaN` when they are not a number. */
function delayMsFromRules(rules: Rules): number {
  return Math.round(Number(rules.delaySeconds) * 1000);
}

/** What stops these rules from being signed, in the words the editor shows. */
export function rulesProblem(rules: Rules): string | null {
  if (!policySchema.shape.budget.safeParse(budgetFromRules(rules)).success)
    return "Enter a valid USD amount with up to two decimal places, or leave the cap empty.";
  if (!policySchema.shape.timelock_ms.safeParse(delayMsFromRules(rules)).success)
    return "Execution delay must be a number of seconds between 0 and 2592000.";
  if (rules.tokens !== "any" && rules.tokens.length === 0)
    return "Pick at least one token, or allow any token.";
  if (rules.limits.some((limit) => !/^[1-9][0-9]*$/.test(limit.perTransaction)))
    return "Enter an amount for every capped token, or remove the cap.";
  if (rules.schedule && !policySchema.shape.schedule.safeParse(rules.schedule).success)
    return rules.schedule.windows.some((window) => window.days.length === 0)
      ? "Pick at least one day for every schedule window."
      : "Every schedule window needs a start and end that differ, in a known time zone.";
  const perHour = rules.maxPerHour.trim();
  if (perHour && !/^[1-9][0-9]{0,6}$/.test(perHour))
    return "Actions per hour must be a whole number, or empty for no cap.";
  return null;
}

/** The tokens a flow may offer: everything, or only what the rules list. */
export function tokenAllowed(rules: Rules | null, assetId: string): boolean {
  if (!rules || rules.tokens === "any") return true;
  return rules.tokens.includes(assetId);
}
