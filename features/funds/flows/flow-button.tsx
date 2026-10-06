"use client";

import { ShieldKeyIcon } from "@hugeicons/core-free-icons";
import { HugeiconsIcon } from "@hugeicons/react";
import { Pending } from "@/components/shared/states";
import { Button } from "@/components/ui/button";
import { useFunds } from "../funds-context";
import { FlowFooter } from "./flow-footer";

export function FlowButton({
  children,
  busy,
  disabled,
  onClick,
  requiresGrant = true,
}: {
  children: React.ReactNode;
  busy?: boolean;
  disabled?: boolean;
  onClick: () => void;
  requiresGrant?: boolean;
}) {
  const funds = useFunds();
  // Spending requires a grant. Creating an incoming deposit address does not.
  if (requiresGrant && !funds.access)
    return (
      <FlowFooter>
        <div className="flex flex-col gap-2">
          <Button size="lg" className="w-full" onClick={funds.enableAccess}>
            <HugeiconsIcon icon={ShieldKeyIcon} className="size-4" />
            Authorize dashboard
          </Button>
          <p className="text-center text-xs text-muted-foreground">
            One grant covers swaps, transfers, withdrawals and shield/unshield. Destinations are
            account rules.
          </p>
        </div>
      </FlowFooter>
    );
  return (
    <FlowFooter>
      <Button size="lg" className="w-full" disabled={disabled || busy} onClick={onClick}>
        {busy ? <Pending /> : null}
        {children}
      </Button>
    </FlowFooter>
  );
}
