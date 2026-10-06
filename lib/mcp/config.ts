import { demoEnv } from "@/lib/config/runtime";

export function agentMcpPath(agentId: string): string {
  return `/api/agents/${encodeURIComponent(agentId)}/mcp`;
}

/** Shared MCP endpoint, RFC 8707 resource and token audience for one account. */
export async function agentResourceUrl(agentId: string): Promise<string> {
  return `${(await demoEnv()).MCP_ORIGIN}${agentMcpPath(agentId)}`;
}

export const AGENT_SCOPE = "agent:full";
export const MCP_SCOPES = [AGENT_SCOPE, "offline_access"] as const;
export const MCP_KEY_TTL_MS = 30 * 24 * 60 * 60 * 1000;
export const mcpIssuer = async () => `${(await demoEnv()).MCP_ORIGIN}/api/auth`;
export const mcpJwksUrl = async () => `${await mcpIssuer()}/jwks`;

/** Accept only an exact, canonical account resource; no query or extra path segments. */
export async function agentIdFromResource(
  resource: string | undefined | null,
): Promise<string | null> {
  if (!resource) return null;
  const origin = (await demoEnv()).MCP_ORIGIN;
  try {
    const url = new URL(resource);
    if (url.origin !== origin || url.search || url.hash || url.username || url.password)
      return null;
    const match = /^\/api\/agents\/([^/]+)\/mcp$/.exec(url.pathname);
    if (!match?.[1]) return null;
    const id = decodeURIComponent(match[1]);
    return id && !/[/?#]/.test(id) && resource === (await agentResourceUrl(id)) ? id : null;
  } catch {
    return null;
  }
}
