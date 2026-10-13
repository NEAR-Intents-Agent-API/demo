import type { Policy, PolicyView } from "@near-intents-agent-api/sdk";
import { type RulesState, rulesState } from "@/lib/policy/rules-state";
import { type AccessView, accessViews } from "./access";
import { agentApi } from "./client";
import { dashboardCommitments } from "./grant-credentials";

/**
 * Everything that limits one agent account, in one read: its rules, its shared USD budget, its
 * execution delay and who may use it. Each part keeps its own source and units; nothing here
 * invents a remaining per-token allowance the provider does not report.
 */
export type AccountControls = {
  rules: { state: RulesState; revision: number | null; policy: Policy | null };
  usage: PolicyView["usage"];
  /** Every grant, active ones first: one per connection, with revoked and expired ones dated. */
  access: AccessView[];
};

export async function readAccountControls(
  userId: string,
  agentId: string,
): Promise<AccountControls> {
  const api = agentApi();
  const [policy, grants, dashboard] = await Promise.all([
    api.getPolicy(agentId),
    api.listGrants(agentId),
    dashboardCommitments(userId, agentId),
  ]);
  return {
    rules: { state: rulesState(policy), revision: policy.revision, policy: policy.policy },
    usage: policy.usage,
    access: accessViews(grants, dashboard),
  };
}
