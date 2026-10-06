import { AuthenticatedShell } from "@/features/auth/index";
import { requireSession } from "@/lib/auth/session";

/**
 * Every dashboard request resolves a session and reads provider state. Nothing here may be
 * prerendered, and deployment secrets are only present at runtime.
 */
export const dynamic = "force-dynamic";

/** Authenticated dashboard shell. Every child route resolves the session server-side. */
export default async function DashboardLayout({ children }: { children: React.ReactNode }) {
  const session = await requireSession();
  return <AuthenticatedShell session={session}>{children}</AuthenticatedShell>;
}
