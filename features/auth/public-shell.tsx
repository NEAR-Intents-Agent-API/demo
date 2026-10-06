import type { ReactNode } from "react";
import { DemoFooter } from "./demo-footer";
import { DemoHeader } from "./demo-header";

export function PublicShell({ children }: { children: ReactNode }) {
  return (
    <div
      className="figma-site flex h-svh flex-col bg-background text-foreground"
      data-theme-adaptive
    >
      <DemoHeader />
      <main className="min-h-0 flex-1 overflow-y-auto">
        <div className="mx-auto w-full max-w-[1440px] px-4 pt-14 pb-12 md:px-8">
          {children}
          <DemoFooter />
        </div>
      </main>
    </div>
  );
}
