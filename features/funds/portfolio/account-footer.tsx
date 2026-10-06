"use client";

import { MonoId } from "@/components/shared/identifiers";

export function AccountFooter({ account }: { account: string }) {
  return (
    <footer className="flex items-center justify-between gap-2 bg-muted/30 px-5 py-3 text-xs text-muted-foreground">
      <span>NEAR Intents account</span>
      <MonoId value={account} head={12} tail={8} className="text-xs" />
    </footer>
  );
}
