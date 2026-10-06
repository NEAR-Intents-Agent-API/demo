"use client";
import { Loading, Unavailable } from "@/components/shared/states";
import { useMcpClients } from "../hooks/use-mcp-clients";
import { McpActivityCard } from "./activity-card";

export function AgentMcpActivity({ agentId }: { agentId: string }) {
  const { view } = useMcpClients(agentId);
  if (view.isPending) return <Loading rows={1} className="p-4 sm:p-5" />;
  if (view.error || !view.data)
    return (
      <Unavailable
        code={view.error?.message ?? "request_failed"}
        onRetry={() => void view.refetch()}
        className="m-4 sm:m-5"
      />
    );
  return <McpActivityCard activity={view.data.activity} />;
}
