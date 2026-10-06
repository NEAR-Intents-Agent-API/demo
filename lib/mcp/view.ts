import type { GrantView } from "@near-intents-agent-api/sdk";
import { agentApi } from "@/lib/agent-api/client";
import { listAgentMcpActivity } from "@/lib/mcp/activity";
import { listClientAccess, type McpClientAccess } from "@/lib/mcp/clients";
import { agentResourceUrl } from "@/lib/mcp/config";
import { ensureAgentResource } from "@/lib/mcp/resources";

function clientStatus(
  client: McpClientAccess,
  grant: GrantView | undefined,
  expiresAt: number | null,
) {
  if (client.status === "revoked" || grant?.revoked_at) return "revoked" as const;
  if (expiresAt !== null && expiresAt <= Date.now()) return "expired" as const;
  if (client.status === "authorized" && grant) return "authorized" as const;
  return "pending" as const;
}

export async function agentMcpView(userId: string, agentId: string) {
  await ensureAgentResource(agentId);
  const [access, grants, activity] = await Promise.all([
    listClientAccess(userId, agentId),
    agentApi().listGrants(agentId),
    listAgentMcpActivity(userId, agentId),
  ]);
  const byId = new Map(grants.map((grant) => [grant.grant_id, grant]));
  return {
    endpoint: await agentResourceUrl(agentId),
    clients: access.map((client) => {
      const grant = client.grantId ? byId.get(client.grantId) : undefined;
      const expiries = [
        client.expiresAt?.getTime(),
        grant ? Date.parse(grant.expires_at) : undefined,
      ].filter((value): value is number => value !== undefined);
      const expiry = expiries.length ? Math.min(...expiries) : null;
      const status = clientStatus(client, grant, expiry);
      return {
        id: client.id,
        name: client.name,
        authKind: client.authKind,
        oauthClientId: client.oauthClientId,
        prepared: Boolean(client.grantCorrelationId),
        status,
        expiresAt: expiry === null ? null : new Date(expiry).toISOString(),
        lastUsedAt: client.lastUsedAt?.toISOString() ?? null,
        prefix: client.prefix,
        grantId: client.grantId,
        revocationPending:
          client.status === "revoked" &&
          Boolean((grant && !grant.revoked_at) || (!client.grantId && client.grantSubmitted)),
      };
    }),
    activity,
  };
}
