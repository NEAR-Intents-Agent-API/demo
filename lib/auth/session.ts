import { headers } from "next/headers";
import { redirect } from "next/navigation";
import { cache } from "react";
import { getDemoAuth } from "@/lib/auth/instance";

export type DemoSession = {
  userId: string;
  email: string;
  name: string;
};

/**
 * Resolves the active owner identity server-side. Never trusts a client-supplied user id.
 * The owner descriptor is resolved separately by `demoOwnerForSession`, because one session
 * can have linked identities while exactly one of them is the active owner.
 */
export const currentSession = cache(async (): Promise<DemoSession | null> => {
  const session = await (await getDemoAuth()).api.getSession({ headers: await headers() });
  if (!session) return null;
  return {
    userId: session.user.id,
    email: session.user.email,
    name: session.user.name,
  };
});

export async function requireSession(): Promise<DemoSession> {
  const session = await currentSession();
  if (!session) redirect("/login");
  return session;
}
