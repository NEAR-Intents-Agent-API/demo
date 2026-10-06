import type { ReactNode } from "react";
import { CatalogProvider } from "@/features/assets";
import { demoOwnerForSession, demoOwnerLabel } from "@/lib/auth/owner-session";
import type { DemoSession } from "@/lib/auth/session";
import { DemoShell } from "./demo-shell";

export async function AuthenticatedShell({
  session,
  children,
}: {
  session: DemoSession;
  children: ReactNode;
}) {
  const owner = await demoOwnerForSession(session);
  return (
    <DemoShell
      identity={{
        name: session.name,
        email: session.email,
        ownerType: owner?.type ?? null,
        ownerLabel: demoOwnerLabel(owner),
      }}
    >
      <CatalogProvider>{children}</CatalogProvider>
    </DemoShell>
  );
}
