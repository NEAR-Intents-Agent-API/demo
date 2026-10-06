import { AgentDetailPage } from "@/features/agents/index";
import { requireOwnedAgentPage } from "@/lib/agent-api/page-guard";

export default async function DashboardAccessPage({
  params,
}: {
  params: Promise<{ agentId: string }>;
}) {
  const { agentId } = await params;
  const agent = await requireOwnedAgentPage(
    agentId,
    `/agents/${encodeURIComponent(agentId)}/access`,
  );
  return <AgentDetailPage agentId={agentId} initialAgent={agent} accessPage />;
}
