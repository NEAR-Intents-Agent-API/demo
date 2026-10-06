import { createHash, randomBytes } from "node:crypto";
import { and, arrayContains, desc, eq, isNull, ne } from "drizzle-orm";
import { getDemoDatabase } from "@/lib/auth/instance";
import type { DemoDatabase } from "@/lib/db/client";
import { mcpClientAccess, oauthConsent, oauthRefreshToken } from "@/lib/db/schema";
import { agentResourceUrl, MCP_KEY_TTL_MS } from "@/lib/mcp/config";

export type McpClientAccess = typeof mcpClientAccess.$inferSelect;
export const hashMcpKey = (value: string) => createHash("sha256").update(value).digest("hex");
export const isMcpKeyValue = (value: string | undefined) => Boolean(value?.startsWith("mcp_"));

export async function createClientAccess(
  input: Pick<McpClientAccess, "userId" | "agentId" | "name" | "authKind"> & {
    oauthClientId?: string;
  },
  database: DemoDatabase = getDemoDatabase(),
): Promise<McpClientAccess> {
  const [row] = await database.db
    .insert(mcpClientAccess)
    .values({ id: crypto.randomUUID(), ...input })
    .returning();
  if (!row) throw new Error("client_access_failed");
  return row;
}

export async function findClientAccess(
  id: string,
  database: DemoDatabase = getDemoDatabase(),
): Promise<McpClientAccess | null> {
  const [row] = await database.db
    .select()
    .from(mcpClientAccess)
    .where(eq(mcpClientAccess.id, id))
    .limit(1);
  return row ?? null;
}

export async function ensureOAuthClient(
  input: { userId: string; agentId: string; oauthClientId: string; name: string },
  database: DemoDatabase = getDemoDatabase(),
): Promise<McpClientAccess> {
  const predicate = and(
    eq(mcpClientAccess.userId, input.userId),
    eq(mcpClientAccess.agentId, input.agentId),
    eq(mcpClientAccess.oauthClientId, input.oauthClientId),
    ne(mcpClientAccess.status, "revoked"),
  );
  await database.db
    .insert(mcpClientAccess)
    .values({ id: crypto.randomUUID(), ...input, authKind: "oauth" })
    .onConflictDoNothing();
  const [row] = await database.db.select().from(mcpClientAccess).where(predicate).limit(1);
  if (!row) throw new Error("client_access_failed");
  return row;
}

export function listClientAccess(
  userId: string,
  agentId: string,
  database: DemoDatabase = getDemoDatabase(),
) {
  return database.db
    .select()
    .from(mcpClientAccess)
    .where(and(eq(mcpClientAccess.userId, userId), eq(mcpClientAccess.agentId, agentId)))
    .orderBy(desc(mcpClientAccess.createdAt));
}

export async function verifyClientKey(
  token: string,
  database: DemoDatabase = getDemoDatabase(),
): Promise<McpClientAccess | null> {
  const [row] = await database.db
    .select()
    .from(mcpClientAccess)
    .where(
      and(
        eq(mcpClientAccess.tokenHash, hashMcpKey(token)),
        eq(mcpClientAccess.authKind, "api_key"),
        eq(mcpClientAccess.status, "authorized"),
      ),
    )
    .limit(1);
  return row?.expiresAt && row.expiresAt.getTime() > Date.now() ? row : null;
}

/** Key creation and activation commit together. Plaintext is returned once. */
export async function activateClient(
  id: string,
  expiresAt: Date,
  database: DemoDatabase = getDemoDatabase(),
): Promise<string | null> {
  const client = await findClientAccess(id, database);
  if (!client || client.status === "revoked") throw new Error("client_revoked");
  const token =
    client.authKind === "api_key" ? `mcp_${randomBytes(32).toString("base64url")}` : null;
  const expiry = new Date(Math.min(expiresAt.getTime(), Date.now() + MCP_KEY_TTL_MS));
  const [updated] = await database.db
    .update(mcpClientAccess)
    .set({
      status: "authorized",
      expiresAt: expiry,
      ...(token ? { tokenHash: hashMcpKey(token), prefix: token.slice(0, 12) } : {}),
      updatedAt: new Date(),
    })
    .where(
      and(
        eq(mcpClientAccess.id, id),
        ne(mcpClientAccess.status, "authorized"),
        ne(mcpClientAccess.status, "revoked"),
      ),
    )
    .returning();
  if (!updated) throw new Error("client_access_conflict");
  return token;
}

/** Block before touching external grants. This generation can never be reopened. */
export async function blockClient(
  client: McpClientAccess,
  database: DemoDatabase = getDemoDatabase(),
): Promise<void> {
  await database.db
    .update(mcpClientAccess)
    .set({ status: "revoked", revokedAt: new Date(), tokenHash: null, updatedAt: new Date() })
    .where(eq(mcpClientAccess.id, client.id));
  if (!client.oauthClientId) return;
  const resource = await agentResourceUrl(client.agentId);
  await database.db
    .update(oauthRefreshToken)
    .set({ revoked: new Date() })
    .where(
      and(
        eq(oauthRefreshToken.userId, client.userId),
        eq(oauthRefreshToken.clientId, client.oauthClientId),
        eq(oauthRefreshToken.referenceId, client.id),
        arrayContains(oauthRefreshToken.resources, [resource]),
        isNull(oauthRefreshToken.revoked),
      ),
    );
  await database.db
    .delete(oauthConsent)
    .where(
      and(
        eq(oauthConsent.userId, client.userId),
        eq(oauthConsent.clientId, client.oauthClientId),
        eq(oauthConsent.referenceId, client.id),
      ),
    );
}

export async function ownedClient(
  userId: string,
  agentId: string,
  id: string,
): Promise<McpClientAccess> {
  const client = await findClientAccess(id);
  if (!client || client.userId !== userId || client.agentId !== agentId)
    throw new Error("client_not_found");
  return client;
}
