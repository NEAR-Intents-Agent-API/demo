import type { SignedData } from "@near-intents-agent-api/sdk";
import { and, eq, ne, sql } from "drizzle-orm";
import { agentApi } from "@/lib/agent-api/client";
import { prepareGrantCredential } from "@/lib/agent-api/grant-credentials";
import { createOwnerIntents, ownerIntents } from "@/lib/agent-api/intents";
import { issuedGrantSchema } from "@/lib/agent-api/schemas";
import { consumeGrantChallenge, storeGrantChallenge } from "@/lib/auth/challenges";
import { getDemoDatabase } from "@/lib/auth/instance";
import { mcpClientAccess } from "@/lib/db/schema";
import {
  activateClient,
  createClientAccess,
  findClientAccess,
  hashMcpKey,
  type McpClientAccess,
  ownedClient,
} from "@/lib/mcp/clients";
import { MCP_KEY_TTL_MS } from "@/lib/mcp/config";
import { forwardOAuthConsent, resolveOAuthClient, validateOAuthQuery } from "@/lib/mcp/oauth";

export async function prepareClientGrant(
  request: Request,
  userId: string,
  agentId: string,
  input: {
    name?: string;
    oauthQuery?: string;
    clientAccessId?: string;
  },
) {
  let access: McpClientAccess;
  if (input.oauthQuery) {
    const client = await validateOAuthQuery(request, input.oauthQuery, agentId);
    access = await resolveOAuthClient(
      { userId, agentId, oauthClientId: client.clientId, name: client.name },
      getDemoDatabase(),
    );
  } else if (input.clientAccessId) {
    access = await ownedClient(userId, agentId, input.clientAccessId);
    if (access.authKind !== "api_key") throw new Error("invalid_request");
  } else {
    if (!input.name) throw new Error("invalid_request");
    access = await createClientAccess({ userId, agentId, name: input.name, authKind: "api_key" });
  }
  if (access.status === "revoked") throw new Error("client_revoked");

  const database = getDemoDatabase();
  // Serialize preparation: one generation gets one persisted grant intent and commitment.
  const prepared = await database.db.transaction(async (transaction) => {
    const scoped = { ...database, db: transaction as unknown as typeof database.db };
    await transaction.execute(
      sql`select "id" from "mcpClientAccess" where "id" = ${access.id} for update`,
    );
    const current = await findClientAccess(access.id, scoped);
    if (!current || current.status === "revoked") throw new Error("client_revoked");
    if (current.grantCorrelationId) {
      if (input.oauthQuery)
        await transaction
          .update(mcpClientAccess)
          .set({ oauthQueryHash: hashMcpKey(input.oauthQuery) })
          .where(eq(mcpClientAccess.id, current.id));
      return createOwnerIntents(scoped, agentApi()).submit(
        userId,
        agentId,
        current.grantCorrelationId,
      );
    }
    const credential = await prepareGrantCredential(
      {
        userId,
        agentId,
        holder: "mcp",
        clientAccessId: current.id,
        label: `MCP: ${current.name}`.slice(0, 64),
      },
      scoped,
    );
    const step = await createOwnerIntents(scoped, agentApi()).generate(userId, {
      type: "grant_issue",
      agent_id: agentId,
      label: credential.label,
      credential: credential.commitment,
      expires_at: new Date(Date.now() + MCP_KEY_TTL_MS + 60 * 60 * 1000).toISOString(),
    });
    await transaction
      .update(mcpClientAccess)
      .set({
        grantCorrelationId: step.generated.correlation_id,
        oauthQueryHash: input.oauthQuery ? hashMcpKey(input.oauthQuery) : null,
        updatedAt: new Date(),
      })
      .where(eq(mcpClientAccess.id, current.id));
    return step;
  });
  const challengeId = await storeGrantChallenge({
    userId,
    agentId,
    clientAccessId: access.id,
    name: access.name,
    generated: prepared.generated,
  });
  return {
    clientAccessId: access.id,
    challengeId,
    ...prepared,
    submitted: (await findClientAccess(access.id))?.grantSubmitted ?? false,
  };
}

export async function authorizeClient(
  request: Request,
  userId: string,
  agentId: string,
  input: {
    clientAccessId: string;
    challengeId?: string;
    signedData?: SignedData;
    oauthQuery?: string;
  },
) {
  const database = getDemoDatabase();
  const access = await ownedClient(userId, agentId, input.clientAccessId);
  if (access.status === "revoked") throw new Error("client_revoked");
  if (access.status === "authorized") {
    if (input.signedData) throw new Error("grant_challenge_invalid");
    let redirect: string | null = null;
    if (access.authKind === "oauth") {
      await checkAuthorizationQuery(request, access, input.oauthQuery);
      redirect = await forwardOAuthConsent(request, input.oauthQuery as string, true);
    }
    return { authorized: true, token: null, redirect_uri: redirect };
  }
  if (!access.grantCorrelationId) throw new Error("grant_challenge_invalid");
  await checkAuthorizationQuery(request, access, input.oauthQuery);
  const signedData = await reserveGrantSubmission(access, input);
  // A lost submission response is observed by correlation ID; never dispatch the proof again.
  const step = await ownerIntents().submit(userId, agentId, access.grantCorrelationId, signedData);
  if (step.operation.status !== "SUCCESS")
    return { authorized: false, token: null, redirect_uri: null, ...step };
  if (
    step.operation.type !== "grant_issue" ||
    !("grant" in step.operation.details) ||
    !step.operation.details.grant
  )
    throw new Error("grant_install_failed");
  const grant = issuedGrantSchema.parse(step.operation.details.grant);
  const [updated] = await database.db
    .update(mcpClientAccess)
    .set({
      grantId: grant.grant_id,
      status: access.authKind === "oauth" ? "consenting" : "pending",
      updatedAt: new Date(),
    })
    .where(
      and(
        eq(mcpClientAccess.id, access.id),
        ne(mcpClientAccess.status, "revoked"),
        ne(mcpClientAccess.status, "authorized"),
      ),
    )
    .returning();
  if (!updated) throw new Error("client_access_conflict");
  let redirect: string | null = null;
  try {
    if (access.authKind === "oauth")
      redirect = await forwardOAuthConsent(request, input.oauthQuery as string, true);
    const token = await activateClient(access.id, new Date(grant.expires_at));
    return { authorized: true, token, redirect_uri: redirect };
  } catch (error) {
    await database.db
      .update(mcpClientAccess)
      .set({ status: "pending" })
      .where(and(eq(mcpClientAccess.id, access.id), eq(mcpClientAccess.status, "consenting")));
    throw error;
  }
}

async function checkAuthorizationQuery(
  request: Request,
  access: McpClientAccess,
  oauthQuery?: string,
) {
  if (access.authKind !== "oauth") return;
  if (!oauthQuery || hashMcpKey(oauthQuery) !== access.oauthQueryHash)
    throw new Error("oauth_query_invalid");
  const client = await validateOAuthQuery(request, oauthQuery, access.agentId);
  if (client.clientId !== access.oauthClientId) throw new Error("oauth_query_invalid");
}

async function reserveGrantSubmission(
  access: McpClientAccess,
  input: { challengeId?: string; signedData?: SignedData },
) {
  if (!input.signedData) {
    if (!access.grantSubmitted) throw new Error("grant_challenge_invalid");
    return undefined;
  }
  if (!input.challengeId) throw new Error("grant_challenge_invalid");
  const stored = await consumeGrantChallenge({
    id: input.challengeId,
    userId: access.userId,
    clientAccessId: access.id,
  });
  if (
    !stored ||
    stored.agentId !== access.agentId ||
    stored.generated.correlation_id !== access.grantCorrelationId
  )
    throw new Error("grant_challenge_invalid");
  const [reserved] = await getDemoDatabase()
    .db.update(mcpClientAccess)
    .set({ grantSubmitted: true })
    .where(
      and(
        eq(mcpClientAccess.id, access.id),
        eq(mcpClientAccess.grantSubmitted, false),
        ne(mcpClientAccess.status, "revoked"),
      ),
    )
    .returning();
  return reserved ? input.signedData : undefined;
}
