import { AgentDetailPage } from "@/features/agents/index";
import { requireOwnedAgentPage } from "@/lib/agent-api/page-guard";

/** The server route itself enforces ownership; the client tabs only read what it resolved. */
export default async function AgentPage({
  params,
  searchParams,
}: {
  params: Promise<{ agentId: string }>;
  searchParams: Promise<Record<string, string | string[] | undefined>>;
}) {
  const [{ agentId }, search] = await Promise.all([params, searchParams]);
  const query = new URLSearchParams();
  for (const [key, value] of Object.entries(search)) {
    if (Array.isArray(value))
      value.forEach((entry) => {
        query.append(key, entry);
      });
    else if (value !== undefined) query.set(key, value);
  }
  const initialAgent = await requireOwnedAgentPage(
    agentId,
    `/agents/${encodeURIComponent(agentId)}?${query}`,
  );
  return <AgentDetailPage agentId={agentId} initialAgent={initialAgent} />;
}
