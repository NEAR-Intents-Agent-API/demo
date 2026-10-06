import type { OwnerWallet } from "@near-intents-agent-api/sdk";
import { eq } from "drizzle-orm";
import { spkiFromCoseBase64 } from "@/lib/auth/passkey-metadata";
import type { DemoDatabase } from "@/lib/db/client";
import { nearAccount, passkey, walletAddress } from "@/lib/db/schema";

export type PasskeySite = { rpId: string; origin: string };

/**
 * Resolves the public owner descriptor for the signed-in demo identity.
 *
 * One active owner identity per session is intentional; cross-provider account linking is
 * out of scope. Resolution is deterministic so a user who linked more than one identity
 * always signs as the same owner. Only public metadata leaves this function.
 */
export async function resolveDemoOwner(input: {
  database: DemoDatabase;
  userId: string;
  passkeySite: PasskeySite;
}): Promise<OwnerWallet | null> {
  const { database, userId } = input;
  const [near] = await database.db
    .select()
    .from(nearAccount)
    .where(eq(nearAccount.userId, userId))
    .limit(1);
  if (near)
    return {
      type: "near",
      account_id: near.accountId,
      public_key: near.publicKey as `ed25519:${string}`,
    };

  const [evm] = await database.db
    .select()
    .from(walletAddress)
    .where(eq(walletAddress.userId, userId))
    .limit(1);
  if (evm?.publicKey)
    return {
      type: "evm",
      address: evm.address.toLowerCase() as `0x${string}`,
      chain_id: evm.chainId,
      public_key: evm.publicKey as `0x${string}`,
    };

  const [webAuthn] = await database.db
    .select()
    .from(passkey)
    .where(eq(passkey.userId, userId))
    .limit(1);
  if (webAuthn)
    return {
      type: "passkey",
      credential_id: webAuthn.credentialID,
      public_key: spkiFromCoseBase64(webAuthn.publicKey),
      rp_id: input.passkeySite.rpId,
      origin: input.passkeySite.origin,
    };

  return null;
}
