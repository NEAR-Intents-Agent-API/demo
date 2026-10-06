import type { GenerateIntentResponse } from "@near-intents-agent-api/sdk";
import { and, eq, gt, lt } from "drizzle-orm";
import { getDemoDatabase } from "@/lib/auth/instance";
import type { DemoDatabase } from "@/lib/db/client";
import { type ChallengePurpose, challenge } from "@/lib/db/schema";

export const CHALLENGE_TTL_MS = 5 * 60 * 1000;

/**
 * Single-use, expiring challenge store for the demo's own ceremonies: MCP grant issuance, and
 * the alphanumeric nonce the SIWE plugin stores in Better Auth's verification table. Better Auth
 * plugin nonces never share a namespace with these, so a login nonce can never be replayed as
 * a grant challenge.
 *
 * `consume` deletes atomically and requires a non-expired row, so a replay, an expired
 * challenge or a challenge issued for another purpose/subject all find nothing.
 */
export function createChallengeStore(database: DemoDatabase = getDemoDatabase()) {
  async function purgeExpired(): Promise<void> {
    await database.db
      .delete(challenge)
      .where(lt(challenge.expiresAt, new Date(Date.now() - CHALLENGE_TTL_MS)));
  }

  return {
    /** ERC-4361-compatible alphanumeric nonce. */
    issue(length = 16): string {
      return Array.from(crypto.getRandomValues(new Uint8Array(length)), (byte) =>
        (byte % 36).toString(36),
      ).join("");
    },
    async register(input: {
      id: string;
      purpose: ChallengePurpose;
      subject: string;
      payload: unknown;
    }): Promise<void> {
      await database.db.insert(challenge).values({
        id: input.id,
        purpose: input.purpose,
        subject: input.subject,
        payload: input.payload,
        expiresAt: new Date(Date.now() + CHALLENGE_TTL_MS),
      });
      await purgeExpired();
    },
    async consume<T = unknown>(input: {
      id: string;
      purpose: ChallengePurpose;
      subject: string;
    }): Promise<T | null> {
      const [row] = await database.db
        .delete(challenge)
        .where(
          and(
            eq(challenge.id, input.id),
            eq(challenge.purpose, input.purpose),
            eq(challenge.subject, input.subject),
            gt(challenge.expiresAt, new Date()),
          ),
        )
        .returning();
      return row ? (row.payload as T) : null;
    },
  };
}

export type ChallengeStore = ReturnType<typeof createChallengeStore>;

export type StoredGrantChallenge = {
  agentId: string;
  clientAccessId: string;
  purpose: "authorize_client";
  name: string;
  generated: GenerateIntentResponse;
};

/**
 * Issuing a harness key creates durable execution authority. A logged-in session alone must not
 * be able to mint one — session theft would otherwise convert into a long-lived credential — so
 * issuance requires a fresh, purpose-specific owner authorization. The signed message binds the
 * agent, custody wallet, the client's grant token commitment and expiry.
 */
export function storeGrantChallenge(
  input: {
    userId: string;
    clientAccessId: string;
    agentId: string;
    name: string;
    generated: GenerateIntentResponse;
  },
  database: DemoDatabase = getDemoDatabase(),
): Promise<string> {
  const id = crypto.randomUUID();
  return createChallengeStore(database)
    .register({
      id,
      purpose: "grant",
      subject: `${input.userId}:${input.clientAccessId}`,
      payload: {
        agentId: input.agentId,
        clientAccessId: input.clientAccessId,
        purpose: "authorize_client",
        name: input.name,
        generated: input.generated,
      },
    })
    .then(() => id);
}

export function consumeGrantChallenge(
  input: { id: string; userId: string; clientAccessId: string },
  database: DemoDatabase = getDemoDatabase(),
): Promise<StoredGrantChallenge | null> {
  return createChallengeStore(database).consume<StoredGrantChallenge>({
    id: input.id,
    purpose: "grant",
    subject: `${input.userId}:${input.clientAccessId}`,
  });
}
