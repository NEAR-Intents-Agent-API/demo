import { and, eq, sql } from "drizzle-orm";
import { hashMessage, recoverMessageAddress, recoverPublicKey } from "viem";
import { z } from "zod";
import { getDemoDatabase } from "@/lib/auth/instance";
import { currentSession } from "@/lib/auth/session";
import { walletAddress } from "@/lib/db/schema";
import { bffError, guardBrowserMutation, readJson } from "@/lib/http/handler";

const keySchema = z.strictObject({
  message: z.string().min(1),
  signature: z.string().min(1),
});

/**
 * `POST /api/auth/evm-key`
 *
 * Stores the EVM public key recovered from a SIWE signature on the signed-in wallet row. The
 * SIWE plugin owns login; this only fills in metadata the Agent API needs for owner proofs.
 *
 * The recovered address is checked against the session, so the write is always scoped to the
 * caller. It is not part of session issuance, so a failure cannot lose a valid session.
 */
export async function POST(request: Request) {
  const guard = guardBrowserMutation(request);
  if (!guard.ok) return bffError(guard.reason, guard.reason === "body_too_large" ? 413 : 403);
  const parsed = keySchema.safeParse(await readJson(request));
  if (!parsed.success) return bffError("invalid_request", 400);
  const session = await currentSession();
  if (!session) return bffError("login_required", 401);
  let address: string;
  let publicKey: string;
  try {
    const signature = parsed.data.signature as `0x${string}`;
    address = (
      await recoverMessageAddress({ message: parsed.data.message, signature })
    ).toLowerCase();
    const recovered = await recoverPublicKey({ hash: hashMessage(parsed.data.message), signature });
    publicKey = `0x${recovered.slice(4)}`;
  } catch {
    return bffError("invalid_request", 400);
  }
  const updated = await getDemoDatabase()
    .db.update(walletAddress)
    .set({ publicKey })
    .where(
      and(
        eq(walletAddress.userId, session.userId),
        sql`lower(${walletAddress.address}) = ${address}`,
      ),
    )
    .returning({ id: walletAddress.id });
  if (updated.length === 0) return bffError("owner_identity_missing", 409);
  return Response.json({ stored: true });
}
