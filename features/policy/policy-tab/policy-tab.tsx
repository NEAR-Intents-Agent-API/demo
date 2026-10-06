"use client";

import type { AgentView } from "@near-intents-agent-api/sdk";
import { Loading, Unavailable } from "@/components/shared/states";
import { EmergencyStop } from "./emergency-stop";
import { PolicyDetails } from "./policy-details";
import { PolicyRules } from "./policy-rules";
import { usePolicyView } from "./use-policy-view";

/**
 * The Rules tab: one set of rules for the account, shared by you and every client. Read first —
 * the summary is the default view — and editing is a deliberate step that ends in one signature.
 */
export function PolicyTab({ agent }: { agent: AgentView }) {
  const policy = usePolicyView(agent.id);
  if (policy.isPending) return <Loading rows={3} />;
  if (policy.error || !policy.data) {
    return (
      <Unavailable
        code={policy.error?.message ?? "request_failed"}
        onRetry={() => void policy.refetch()}
      />
    );
  }
  const view = policy.data;
  return (
    <div className="flex min-w-0 flex-col gap-5">
      <PolicyRules agent={agent} view={view} />
      <PolicyDetails
        agentId={agent.id}
        view={view}
        hasOwner={Boolean(agent.owner)}
        emergencyStop={
          agent.owner && agent.owner_account && view.policy ? (
            <EmergencyStop agentId={agent.id} view={view} />
          ) : undefined
        }
      />
    </div>
  );
}
