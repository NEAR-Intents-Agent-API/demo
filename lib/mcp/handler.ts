import { createMcpProtectedRequestHandler } from "@better-auth/mcp";
import { createMcpHandler } from "@modelcontextprotocol/server";
import { and, eq } from "drizzle-orm";
import { agentApi } from "@/lib/agent-api/client";
import { heldGrant } from "@/lib/agent-api/grant-credentials";
import { requireConfiguredNetwork } from "@/lib/agent-api/network";
import { agentBelongsToUser } from "@/lib/agent-api/ownership";
import { getDemoDatabase } from "@/lib/auth/instance";
import { mcpClientAccess } from "@/lib/db/schema";
import {
  findClientAccess,
  isMcpKeyValue,
  type McpClientAccess,
  verifyClientKey,
} from "@/lib/mcp/clients";
import { AGENT_SCOPE, agentResourceUrl, mcpIssuer, mcpJwksUrl } from "@/lib/mcp/config";
import { createAgentMcpServer } from "@/lib/mcp/server";

const denied = (code: string, status = 401) =>
  Response.json(
    { jsonrpc: "2.0", error: { code: -32000, message: code }, id: null },
    { status, headers: { "Cache-Control": "no-store" } },
  );

export async function serveAgentMcp(request: Request, agentId: string): Promise<Response> {
  await getDemoDatabase().checkConnection();
  const gate = await requireConfiguredNetwork();
  if (!gate.ok) return denied(gate.reason, 503);
  const bearer = request.headers
    .get("authorization")
    ?.match(/^Bearer (.+)$/)?.[1]
    ?.trim();
  if (isMcpKeyValue(bearer)) {
    const client = await verifyClientKey(bearer as string);
    return client && client.agentId === agentId
      ? serve(request, client, client.id)
      : denied("invalid_token");
  }
  return createMcpProtectedRequestHandler(
    {
      issuer: await mcpIssuer(),
      audience: await agentResourceUrl(agentId),
      jwksUrl: await mcpJwksUrl(),
      requiredScopes: [AGENT_SCOPE],
      challengeScopes: [AGENT_SCOPE],
    },
    async (_request, claims) => {
      if (
        typeof claims.sub !== "string" ||
        typeof claims.client_id !== "string" ||
        typeof claims.mcp_access_id !== "string"
      )
        return denied("invalid_token");
      const client = await findClientAccess(claims.mcp_access_id);
      if (
        client?.authKind !== "oauth" ||
        client.userId !== claims.sub ||
        client.oauthClientId !== claims.client_id ||
        client.agentId !== agentId
      )
        return denied("invalid_token");
      return serve(request, client, claims.sub);
    },
  )(request);
}

async function serve(
  request: Request,
  access: McpClientAccess,
  subject: string,
): Promise<Response> {
  if (
    access.status !== "authorized" ||
    !access.expiresAt ||
    access.expiresAt.getTime() <= Date.now()
  )
    return denied("client_unauthorized", 403);
  const api = agentApi();
  const agent = await api.getAgent(access.agentId).catch(() => null);
  if (!agent || !agentBelongsToUser(agent, access.userId)) return denied("agent_not_found", 404);
  if (agent.deleted) return denied("agent_deleted", 410);
  if (agent.archived || !agent.owner || !agent.wallet) return denied("agent_not_available", 403);
  const held = await heldGrant(api, {
    userId: access.userId,
    agentId: access.agentId,
    holder: "mcp",
    clientAccessId: access.id,
  }).catch(() => null);
  if (!held || held.grant.grant_id !== access.grantId) return denied("client_unauthorized", 403);
  // Recheck local authorization after external reads, before dispatching any tool.
  const current = await findClientAccess(access.id);
  if (current?.status !== "authorized") return denied("client_unauthorized", 403);
  await getDemoDatabase()
    .db.update(mcpClientAccess)
    .set({ lastUsedAt: new Date() })
    .where(and(eq(mcpClientAccess.id, access.id), eq(mcpClientAccess.status, "authorized")));
  return createMcpHandler(
    () =>
      createAgentMcpServer({
        identity: {
          clientAccessId: access.id,
          clientName: access.name,
          agentId: access.agentId,
          userId: access.userId,
          authKind: access.authKind,
          subject,
        },
        client: held.client,
      }),
    // SDK negotiation serves 2025 clients and the 2026 per-request protocol on one endpoint.
    { legacy: "stateless" },
  ).fetch(request);
}
