import type { PolicyView } from "@near-intents-agent-api/sdk";

/**
 * Whether the account's latest signed rules are the ones the provider enforces. Until they are,
 * the Agent API refuses every move, so a signed revision is never shown as usable.
 */
export type RulesState = "in_force" | "applying" | "not_applied" | "none";

export function rulesState(view: PolicyView): RulesState {
  if (view.status === "APPLIED" && view.provider_policy_synced) return "in_force";
  if (view.status === "FAILED") return "not_applied";
  if (view.status === "NONE") return "none";
  return "applying";
}
