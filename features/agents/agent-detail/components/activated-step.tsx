"use client";

import { Tick02Icon } from "@hugeicons/core-free-icons";
import { HugeiconsIcon } from "@hugeicons/react";
import { SetupFlowPanel } from "@/components/shared/setup-flow-panel";
import { Button } from "@/components/ui/button";
import { useDialogLocked } from "@/hooks/use-dialog-busy";

export function ActivatedStep({
  onContinue,
  plain = false,
}: {
  onContinue: () => void;
  plain?: boolean;
}) {
  const locked = useDialogLocked();
  return (
    <SetupFlowPanel
      plain={plain}
      hideHeading={plain}
      step={2}
      title="Account activated"
      description="Your account is active. Its rules apply to the dashboard and every connected client."
      footer={
        <Button disabled={locked} onClick={onContinue}>
          Continue to add funds
        </Button>
      }
    >
      <div className="flex items-center gap-3 rounded-md bg-success-muted/40 p-4">
        <HugeiconsIcon icon={Tick02Icon} className="size-5 text-success" />
        <p className="text-sm">Ownership confirmed. Account rules installed.</p>
      </div>
      <p className="text-sm leading-6 text-muted-foreground">
        Next, add funds. Dashboard access is optional; your client will have its own grant.
      </p>
    </SetupFlowPanel>
  );
}
