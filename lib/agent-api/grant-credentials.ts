import { createCipheriv, createDecipheriv, createHash, randomBytes } from "node:crypto";
import { type AgentApi, createGrantCredential, type GrantView } from "@near-intents-agent-api/sdk";
import { and, eq } from "drizzle-orm";
import { getDemoDatabase } from "@/lib/auth/instance";
import { parseDemoEnv } from "@/lib/config/env";
import type { DemoDatabase } from "@/lib/db/client";
import { grantCredential } from "@/lib/db/schema";

/** Who in the demo holds a grant: the dashboard itself, or one MCP client. */
export type GrantHolder = { holder: "dashboard" } | { holder: "mcp"; clientAccessId: string };

/** A live owner grant and a client whose delegated calls run under it. */
export type HeldGrant = { grant: GrantView; client: AgentApi };

const sealVersion = "v1";

function sealingKey(): Buffer {
  return createHash("sha256")
    .update(`near-agent-demo.grant-token.${sealVersion}:${parseDemoEnv().SECRET_ENCRYPTION_KEY}`)
    .digest();
}

function sealToken(token: string, commitment: string): string {
  const iv = randomBytes(12);
  const cipher = createCipheriv("aes-256-gcm", sealingKey(), iv);
  // The commitment is bound as associated data, so a sealed token cannot move to another row.
  cipher.setAAD(Buffer.from(commitment));
  const sealed = Buffer.concat([cipher.update(token, "utf8"), cipher.final(), cipher.getAuthTag()]);
  return [sealVersion, iv.toString("base64url"), sealed.toString("base64url")].join(".");
}

function openToken(sealed: string, commitment: string): string {
  const [version, iv, body] = sealed.split(".");
  if (version !== sealVersion || !iv || !body) throw new Error("grant_token_unreadable");
  const bytes = Buffer.from(body, "base64url");
  const decipher = createDecipheriv("aes-256-gcm", sealingKey(), Buffer.from(iv, "base64url"));
  decipher.setAAD(Buffer.from(commitment));
  decipher.setAuthTag(bytes.subarray(bytes.length - 16));
  return Buffer.concat([
    decipher.update(bytes.subarray(0, bytes.length - 16)),
    decipher.final(),
  ]).toString("utf8");
}

/**
 * Creates and stores the token for one new grant, before the owner signs. Only the commitment
 * goes into the `grant_issue` intent; the grant exists once the owner's signature is submitted.
 */
export async function prepareGrantCredential(
  input: { userId: string; agentId: string; label: string } & GrantHolder,
  database: DemoDatabase = getDemoDatabase(),
): Promise<{ label: string; commitment: string }> {
  const { token, commitment } = createGrantCredential();
  await database.db.insert(grantCredential).values({
    id: crypto.randomUUID(),
    userId: input.userId,
    agentId: input.agentId,
    holder: input.holder,
    clientAccessId: input.holder === "mcp" ? input.clientAccessId : null,
    label: input.label,
    commitment,
    sealedToken: sealToken(token, commitment),
  });
  return { label: input.label, commitment };
}

/**
 * The holder's live grant on one agent, read from the Agent API on every call: the owner-signed
 * message names the token's commitment, so a revoked, expired or never-signed grant resolves to
 * nothing. The newest signed grant wins; expiration or revocation must never restore an older
 * permission. Unsigned preparations leave the current grant usable.
 */
export async function heldGrant(
  client: AgentApi,
  input: { userId: string; agentId: string } & GrantHolder,
  database: DemoDatabase = getDemoDatabase(),
  now: number = Date.now(),
): Promise<HeldGrant | null> {
  const credentials = await database.db
    .select()
    .from(grantCredential)
    .where(
      and(
        eq(grantCredential.userId, input.userId),
        eq(grantCredential.agentId, input.agentId),
        eq(grantCredential.holder, input.holder),
        input.holder === "mcp"
          ? eq(grantCredential.clientAccessId, input.clientAccessId)
          : undefined,
      ),
    );
  if (!credentials.length) return null;
  const byCommitment = new Map(
    credentials.map((credential) => [credential.commitment, credential]),
  );
  // The API lists grants newest installation first. Preparation order cannot choose the active
  // permission: an older prepared challenge may be signed after a more recent preparation.
  const grants = await client.listGrants(input.agentId);
  for (const grant of grants) {
    const credential = byCommitment.get(grant.owner_message.credential);
    if (credential) {
      if (grant.revoked_at !== null || Date.parse(grant.expires_at) <= now) return null;
      return {
        grant,
        client: client.forGrant(openToken(credential.sealedToken, credential.commitment)),
      };
    }
  }
  return null;
}

/** Forgets every token a client held, so nothing in the demo can use its grants again. */
export async function forgetClientCredentials(
  clientAccessId: string,
  database: DemoDatabase = getDemoDatabase(),
): Promise<void> {
  await database.db
    .delete(grantCredential)
    .where(eq(grantCredential.clientAccessId, clientAccessId));
}
