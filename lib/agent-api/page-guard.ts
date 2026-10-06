import type { AgentView } from "@near-intents-agent-api/sdk";
import { notFound, redirect } from "next/navigation";
import { requireOwnedAgent } from "@/lib/agent-api/guard";
import { currentSession } from "@/lib/auth/session";

/**
 * Server-component ownership gate. Pages pass the same session + network + owner check the
 * BFF routes use, but express failure as a navigation outcome: unauthenticated visitors are
 * redirected to login, and an agent that is not theirs is rendered as not found.
 */
export async function requireOwnedAgentPage(
  agentId: string,
  returnTo = `/agents/${agentId}`,
): Promise<AgentView> {
  const session = await currentSession();
  if (!session) redirect(`/login?returnTo=${encodeURIComponent(returnTo)}`);
  const guarded = await requireOwnedAgent(agentId);
  if (!guarded.ok) {
    if (guarded.response.status === 401)
      redirect(`/login?returnTo=${encodeURIComponent(returnTo)}`);
    if (guarded.response.status === 404) notFound();
    throw new Error("agent_page_unavailable");
  }
  return guarded.agent;
}
