"use client";

import type { ReactNode } from "react";
import { Button } from "@/components/ui/button";
import { DialogFooter } from "./dialog-footer";

export function SetupStepFooter({
  busy,
  children,
  onSkip,
  skipLabel = "Skip for now",
}: {
  busy: boolean;
  children: ReactNode;
  onSkip?: () => void;
  skipLabel?: string;
}) {
  return (
    <DialogFooter>
      <div className="grid w-full auto-cols-fr grid-flow-col items-stretch gap-3 border-t pt-4">
        {onSkip ? (
          <Button
            variant="outline"
            size="lg"
            className="h-auto min-h-11 min-w-0 w-full whitespace-normal"
            disabled={busy}
            onClick={onSkip}
          >
            {skipLabel}
          </Button>
        ) : null}
        <div className="flex min-w-0 [&>button]:h-auto [&>button]:min-h-11 [&>button]:w-full [&>button]:whitespace-normal">
          {children}
        </div>
      </div>
    </DialogFooter>
  );
}
