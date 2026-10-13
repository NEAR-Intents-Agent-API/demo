import type { AgentListItem } from "@/lib/agent-api/agent-list";
import { AgentListRow } from "../../components/agent-list-row";
import { agentState } from "../../model/agent-state";

export function AgentAccountList({ agents }: { agents: AgentListItem[] }) {
  return (
    <section className="flex flex-col gap-5" aria-labelledby="accounts-title">
      <h2
        id="accounts-title"
        className="flex items-center gap-2 text-[22px] leading-7 font-bold tracking-[-0.35px]"
      >
        Your accounts
        <span className="site-mono text-xs font-normal text-primary">{agents.length}</span>
      </h2>
      <ul className="flex min-w-0 flex-col gap-3">
        {agents.map((agent) => (
          <AgentListRow key={agent.id} agent={agent} state={agentState(agent)} />
        ))}
      </ul>
    </section>
  );
}
