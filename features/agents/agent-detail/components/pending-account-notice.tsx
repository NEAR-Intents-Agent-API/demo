"use client";

import { Button } from "@/components/ui/button";
import { useActivationDialog } from "../hooks/use-activation-dialog";
import { ActivationDialog } from "./activation-dialog";

export function PendingAccountNotice({ agentId }: { agentId: string }) {
  const { open, setOpen, onboarding } = useActivationDialog(agentId);
  return (
    <>
      <section
        aria-label="Incomplete activation"
        className="flex flex-wrap items-center justify-between gap-3 rounded-lg border border-primary/20 bg-primary/5 px-4 py-3"
      >
        <div className="min-w-0">
          <h2 className="text-sm font-medium">Account activation is incomplete</h2>
          <p className="mt-1 text-xs leading-5 text-muted-foreground">
            Finish activation before adding funds or connecting a client.
          </p>
        </div>
        <Button variant="outline" size="sm" onClick={() => setOpen(true)}>
          Continue activation
        </Button>
      </section>
      {open ? <ActivationDialog view={onboarding} onClose={() => setOpen(false)} /> : null}
    </>
  );
}
