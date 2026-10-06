import { agentApi } from "@/lib/agent-api/client";
import { requireConfiguredNetwork } from "@/lib/agent-api/network";
import { AGENT_SCOPE, agentResourceUrl, mcpIssuer } from "@/lib/mcp/config";
import { agentResourceExists } from "@/lib/mcp/resources";

export async function GET(_request: Request, context: { params: Promise<{ agentId: string }> }) {
  const { agentId } = await context.params;
  const gate = await requireConfiguredNetwork();
  if (!gate.ok) return Response.json({ error: { code: gate.reason } }, { status: 503 });
  if (!(await agentResourceExists(agentId)))
    return Response.json({ error: { code: "resource_not_found" } }, { status: 404 });
  const agent = await agentApi()
    .getAgent(agentId)
    .catch(() => null);
  if (!agent || agent.deleted || agent.archived || !agent.wallet || !agent.owner)
    return Response.json({ error: { code: "resource_not_found" } }, { status: 404 });
  return Response.json(
    {
      resource: await agentResourceUrl(agentId),
      authorization_servers: [await mcpIssuer()],
      scopes_supported: [AGENT_SCOPE],
      bearer_methods_supported: ["header"],
    },
    { headers: { "Cache-Control": "no-store" } },
  );
}
