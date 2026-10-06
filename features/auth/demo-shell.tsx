"use client";
import { usePathname } from "next/navigation";
import { DashboardPalette } from "@/components/shell/dashboard-palette";
import { useCommandShortcut } from "@/components/shell/use-command-shortcut";
import { useAgents } from "@/features/agents/data";
import { cn } from "@/lib/utils";
import { DemoFooter } from "./demo-footer";
import { DemoHeader } from "./demo-header";
import type { DemoIdentity } from "./types";
import { useSignOut } from "./use-sign-out";

export function DemoShell({
  identity,
  children,
}: {
  identity: DemoIdentity;
  children: React.ReactNode;
}) {
  const [paletteOpen, setPaletteOpen] = useCommandShortcut();
  const agents = useAgents();
  const signOut = useSignOut();
  const pathname = usePathname();
  const siteStyle =
    pathname === "/how-it-works" || pathname === "/agents" || pathname === "/agents/new";
  return (
    <div
      className={cn(
        "flex h-svh flex-col",
        siteStyle ? "figma-site bg-background text-foreground" : "console-shell",
      )}
      data-theme-adaptive={siteStyle ? "" : undefined}
    >
      <DemoHeader
        identity={identity}
        onSearch={() => setPaletteOpen(true)}
        onSignOut={signOut.signOut}
        signingOut={signOut.pending}
      />
      <main className="min-h-0 flex-1 overflow-y-auto">
        <div
          className={cn(
            "mx-auto w-full max-w-[1440px] px-4 md:px-8",
            siteStyle ? "pt-14 pb-12" : "py-8 md:py-10",
          )}
        >
          {signOut.error ? (
            <p role="alert" className="mb-4 text-sm text-destructive">
              {signOut.error}
            </p>
          ) : null}
          {children}
          <DemoFooter />
        </div>
      </main>

      <DashboardPalette
        open={paletteOpen}
        onOpenChange={setPaletteOpen}
        agents={agents.data?.agents ?? []}
        ownerLabel={identity.ownerLabel}
        onSignOut={signOut.signOut}
        signingOut={signOut.pending}
      />
    </div>
  );
}
