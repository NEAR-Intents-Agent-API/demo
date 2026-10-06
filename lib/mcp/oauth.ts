import { getOAuthProviderState, type OAuthProviderExtension } from "@better-auth/oauth-provider";
import { APIError } from "better-auth/api";
import { eq } from "drizzle-orm";
import { agentApi } from "@/lib/agent-api/client";
import { heldGrant } from "@/lib/agent-api/grant-credentials";
import { requireConfiguredNetwork } from "@/lib/agent-api/network";
import { agentBelongsToUser } from "@/lib/agent-api/ownership";
import { getDemoAuth } from "@/lib/auth/instance";
import { demoEnv } from "@/lib/config/runtime";
import type { DemoDatabase } from "@/lib/db/client";
import { oauthClient } from "@/lib/db/schema";
import { blockClient, ensureOAuthClient, findClientAccess } from "@/lib/mcp/clients";
import { agentIdFromResource } from "@/lib/mcp/config";

/** Expired or externally revoked grants require a fresh authorization generation. */
export async function resolveOAuthClient(
  input: { userId: string; agentId: string; oauthClientId: string; name: string },
  database: DemoDatabase,
) {
  const access = await ensureOAuthClient(input, database);
  if (access.status !== "authorized") return access;
  const held = await heldGrant(
    agentApi(),
    { userId: input.userId, agentId: input.agentId, holder: "mcp", clientAccessId: access.id },
    database,
  );
  if (
    access.expiresAt &&
    access.expiresAt.getTime() > Date.now() &&
    held?.grant.grant_id === access.grantId
  )
    return access;
  await blockClient(access, database);
  return ensureOAuthClient(input, database);
}

/** Provider state is parsed/verified by Better Auth, including signed consent continuations. */
export async function oauthConsentReference(
  userId: string,
  database: DemoDatabase,
): Promise<string> {
  const state = await getOAuthProviderState();
  const query = new URLSearchParams(state?.query);
  const resources = query.getAll("resource");
  const agentId = resources.length === 1 ? await agentIdFromResource(resources[0]) : null;
  const clientId = query.get("client_id");
  if (!agentId || !clientId) throw new APIError("BAD_REQUEST", { error: "invalid_resource" });
  const gate = await requireConfiguredNetwork();
  const agent = gate.ok
    ? await agentApi()
        .getAgent(agentId)
        .catch(() => null)
    : null;
  if (
    !agent ||
    !agentBelongsToUser(agent, userId) ||
    !agent.owner ||
    !agent.wallet ||
    agent.deleted ||
    agent.archived
  )
    throw new APIError("FORBIDDEN", { error: "access_denied" });
  const [client] = await database.db
    .select()
    .from(oauthClient)
    .where(eq(oauthClient.clientId, clientId))
    .limit(1);
  return (
    await resolveOAuthClient(
      { userId, agentId, oauthClientId: clientId, name: client?.name ?? clientId },
      database,
    )
  ).id;
}

export function mcpAccessClaims(database: DemoDatabase): OAuthProviderExtension {
  return {
    claims: {
      accessToken: async ({ user, client, referenceId, resources }) => {
        const access = referenceId ? await findClientAccess(referenceId, database) : null;
        if (
          access?.status !== "authorized" ||
          access.authKind !== "oauth" ||
          access.userId !== user?.id ||
          access.oauthClientId !== client.clientId ||
          resources?.length !== 1 ||
          (await agentIdFromResource(resources[0])) !== access.agentId
        )
          throw new APIError("FORBIDDEN", { error: "access_denied" });
        const held = await heldGrant(
          agentApi(),
          {
            userId: access.userId,
            agentId: access.agentId,
            holder: "mcp",
            clientAccessId: access.id,
          },
          database,
        );
        if (
          !held ||
          held.grant.grant_id !== access.grantId ||
          !access.expiresAt ||
          access.expiresAt.getTime() <= Date.now()
        )
          throw new APIError("FORBIDDEN", { error: "access_denied" });
        return { mcp_access_id: access.id };
      },
    },
  };
}

/** Use provider's signed-query verification; never implement OAuth signatures ourselves. */
export async function validateOAuthQuery(
  request: Request,
  oauthQuery: string,
  agentId: string,
): Promise<{ clientId: string; name: string }> {
  const query = new URLSearchParams(oauthQuery);
  const resources = query.getAll("resource");
  const clientId = query.get("client_id");
  if (!clientId || resources.length !== 1 || (await agentIdFromResource(resources[0])) !== agentId)
    throw new Error("resource_not_found");
  const origin = (await demoEnv()).BETTER_AUTH_URL;
  const response = await (await getDemoAuth()).handler(
    new Request(`${origin}/api/auth/oauth2/public-client-prelogin`, {
      method: "POST",
      headers: {
        "content-type": "application/json",
        cookie: request.headers.get("cookie") ?? "",
        origin,
      },
      body: JSON.stringify({ client_id: clientId, oauth_query: oauthQuery }),
    }),
  );
  if (!response.ok) throw new Error("oauth_query_invalid");
  const client = (await response.json()) as { client_id: string; client_name?: string };
  return { clientId, name: client.client_name ?? clientId };
}

export async function forwardOAuthConsent(
  request: Request,
  oauthQuery: string,
  accept: boolean,
): Promise<string> {
  const origin = (await demoEnv()).BETTER_AUTH_URL;
  const response = await (await getDemoAuth()).handler(
    new Request(`${origin}/api/auth/oauth2/consent`, {
      method: "POST",
      headers: {
        "content-type": "application/json",
        cookie: request.headers.get("cookie") ?? "",
        origin,
      },
      body: JSON.stringify({ accept, oauth_query: oauthQuery }),
    }),
  );
  const body = (await response.json().catch(() => null)) as {
    redirect_uri?: string;
    url?: string;
  } | null;
  const redirect = body?.redirect_uri ?? body?.url;
  if (!response.ok || !redirect) throw new Error("consent_failed");
  if (accept) {
    const target = new URL(redirect);
    const query = new URLSearchParams(oauthQuery);
    const expected = new URL(query.get("redirect_uri") as string);
    if (
      target.origin !== expected.origin ||
      target.pathname !== expected.pathname ||
      target.searchParams.has("error") ||
      target.searchParams.getAll("code").length !== 1 ||
      !target.searchParams.get("code") ||
      target.searchParams.get("state") !== query.get("state")
    )
      throw new Error("consent_failed");
  }
  return redirect;
}
