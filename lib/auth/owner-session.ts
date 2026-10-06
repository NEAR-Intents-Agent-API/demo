import type { OwnerWallet } from "@near-intents-agent-api/sdk";
import { passkeyRpId } from "@/lib/auth/authority";
import { getDemoDatabase } from "@/lib/auth/instance";
import { resolveDemoOwner } from "@/lib/auth/owner-identity";
import type { DemoSession } from "@/lib/auth/session";
import { demoEnv } from "@/lib/config/runtime";

/**
 * Resolves the public owner descriptor for the signed-in demo user. The descriptor is only
 * usable together with a fresh binding/policy proof; it is never a credential by itself.
 */
export async function demoOwnerForSession(session: DemoSession): Promise<OwnerWallet | null> {
  const config = await demoEnv();
  return resolveDemoOwner({
    database: getDemoDatabase(),
    userId: session.userId,
    passkeySite: { rpId: passkeyRpId(config), origin: config.PASSKEY_ORIGIN },
  });
}

export function demoOwnerLabel(owner: OwnerWallet | null): string | null {
  if (!owner) return null;
  switch (owner.type) {
    case "near":
      return owner.account_id;
    case "evm":
      return owner.address;
    case "passkey":
      return owner.credential_id.slice(0, 12);
  }
}
