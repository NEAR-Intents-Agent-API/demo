import { eq } from "drizzle-orm";
import type { DemoDatabase } from "@/lib/db/client";
import { user } from "@/lib/db/schema";

/** Deterministic placeholder email for a passkey-first demo user. */
export function passkeyPlaceholderEmail(userId: string): string {
  return `${userId}@passkey.demo.invalid`;
}

/**
 * Resolves the user for a passkey-first registration.
 *
 * A visitor with no session has no identity yet, so a stable anonymous user is created for
 * the credential. Passkey credentials are public metadata plus a counter; the private key
 * stays in the user's authenticator.
 *
 * `better-auth` calls this only when no session exists. Returning an existing id keeps a
 * re-registration attached to the same demo user instead of stranding it.
 */
export async function resolvePasskeyRegistration(input: {
  database: DemoDatabase;
  userId?: string;
}): Promise<{ id: string; name: string; displayName: string }> {
  const id = input.userId ?? crypto.randomUUID();
  const existing = await input.database.db.select().from(user).where(eq(user.id, id)).limit(1);
  if (existing.length === 0) {
    await input.database.db.insert(user).values({
      id,
      name: `Passkey ${id.slice(0, 8)}`,
      email: passkeyPlaceholderEmail(id),
    });
  }
  const name = `Passkey ${id.slice(0, 8)}`;
  return { id, name, displayName: name };
}
