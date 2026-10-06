import type { Policy, PolicyView } from "@near-intents-agent-api/sdk";
import { type RulesState, rulesState } from "@/lib/policy/rules-state";
import { type AccessView, accessView } from "./access";
import { agentApi } from "./client";

/**
 * Everything that limits one agent account, in one read: its rules, its shared USD budget, its
 * execution delay and who may use it. Each part keeps its own source and units; nothing here
 * invents a remaining per-token allowance the provider does not report.
 */
export type AccountControls = {
  rules: { state: RulesState; revision: number | null; policy: Policy | null };
  usage: PolicyView["usage"];
  /** Live grants only: one per connection that can use the account now. */
  access: AccessView[];
};

export async function readAccountControls(agentId: string): Promise<AccountControls> {
  const api = agentApi();
  const [policy, grants] = await Promise.all([api.getPolicy(agentId), api.listGrants(agentId)]);
  const now = Date.now();
  return {
    rules: { state: rulesState(policy), revision: policy.revision, policy: policy.policy },
    usage: policy.usage,
    access: grants
      .filter((grant) => grant.revoked_at === null && Date.parse(grant.expires_at) > now)
      .map(accessView),
  };
}
