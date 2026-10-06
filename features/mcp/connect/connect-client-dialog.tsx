"use client";

import type { RefObject } from "react";
import { ResponsiveDialog } from "@/components/responsive-dialog";
import { DialogBusyContext } from "@/components/shared/dialog-busy-context";
import { useDialogBusyTarget } from "@/hooks/use-dialog-busy";
import { ConnectTab } from "./connect-tab";

export function ConnectClientDialog({
  agentId,
  onOpenChange,
  returnFocus,
}: {
  agentId: string;
  onOpenChange: (open: boolean) => void;
  returnFocus: RefObject<HTMLButtonElement | null>;
}) {
  const { locked, value } = useDialogBusyTarget(false);
  return (
    <DialogBusyContext.Provider value={value}>
      <ResponsiveDialog
        open
        busy={locked}
        onOpenChange={onOpenChange}
        returnFocus={returnFocus}
        title="Connect a client"
        description="Connect using the MCP endpoint, then approve access."
        contentClassName="sm:max-w-lg"
        showDrawerCloseButton
        bodyClassName="pt-2"
      >
        <ConnectTab agentId={agentId} plain />
      </ResponsiveDialog>
    </DialogBusyContext.Provider>
  );
}
