"use client";

import type { AgentView } from "@near-intents-agent-api/sdk";
import { Unavailable } from "@/components/shared/states";
import { useAgent } from "../api/agent-queries";
import { AgentBackLink } from "../components/agent-back-link";
import { AgentDetailSkeleton } from "../components/agent-detail-skeleton";
import { agentState } from "../model/agent-state";
import { AgentAccountWorkspace } from "./components/agent-account-workspace";
import { AgentHeader } from "./components/agent-header";
import { AgentNextStep } from "./components/agent-next-step";

/** One account: balances and funds actions above history, rules and client tabs. */
export function AgentDetailPage({
  agentId,
  initialAgent,
  accessPage = false,
}: {
  agentId: string;
  initialAgent: AgentView;
  accessPage?: boolean;
}) {
  const agent = useAgent(agentId, initialAgent);

  if (agent.isPending) return <AgentDetailSkeleton />;
  if (!agent.data) {
    return (
      <div className="flex flex-col gap-4">
        <AgentBackLink />
        <Unavailable
          code={agent.error?.message ?? "request_failed"}
          onRetry={() => void agent.refetch()}
        />
      </div>
    );
  }

  const data = agent.data;
  const state = agentState(data);
  // Provider views exist only once the owner's signature made the agent live.
  const live = data.status !== "PENDING" && data.status !== "ABANDONED";

  return (
    <div className="flex flex-col gap-6">
      {!live ? <AgentBackLink /> : null}
      {live ? (
        <AgentAccountWorkspace
          agent={data}
          state={state}
          accessPage={accessPage}
          refreshing={agent.isFetching}
          onRefresh={() => void agent.refetch()}
          error={agent.error?.message}
        />
      ) : (
        <>
          <AgentHeader
            agent={data}
            state={state}
            refreshing={agent.isFetching}
            onRefresh={() => void agent.refetch()}
          />
          {agent.error ? (
            <Unavailable code={agent.error.message} onRetry={() => void agent.refetch()} />
          ) : null}
          <AgentNextStep agent={data} state={state} />
        </>
      )}
    </div>
  );
}
