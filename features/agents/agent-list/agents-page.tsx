"use client";
import { Unavailable } from "@/components/shared/states";
import { useAgents } from "../api/agent-queries";
import { AgentListSkeleton } from "../components/agent-list-skeleton";
import { visibleAgents, workspaceSummary } from "../model/agent-state";
import { AgentAccountList } from "./components/agent-account-list";
import { AgentsPageHeader } from "./components/agents-page-header";
import { Welcome } from "./components/agents-welcome";
import { SummaryStrip } from "./components/summary-strip";

/** The workspace: every account this owner holds, each one wallet + rules + history. */
export function AgentsPage() {
  const agents = useAgents();
  // Rows and counters share one list: deleted and never-activated accounts are in neither.
  const list = visibleAgents(agents.data?.agents ?? []);
  const summary = workspaceSummary(list);

  return (
    <div className="flex flex-col gap-14">
      <AgentsPageHeader refreshing={agents.isFetching} onRefresh={() => void agents.refetch()} />

      {agents.isPending ? (
        <AgentListSkeleton />
      ) : agents.error && !agents.data ? (
        <Unavailable
          code={agents.error.message}
          onRetry={() => void agents.refetch()}
          className="max-w-2xl"
        />
      ) : list.length === 0 ? (
        <Welcome />
      ) : (
        <>
          {agents.error ? (
            <Unavailable code={agents.error.message} onRetry={() => void agents.refetch()} />
          ) : null}
          <SummaryStrip summary={summary} />
          <AgentAccountList agents={list} />
        </>
      )}
    </div>
  );
}
