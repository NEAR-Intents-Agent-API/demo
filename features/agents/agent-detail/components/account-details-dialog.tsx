"use client";

import type { AgentView } from "@near-intents-agent-api/sdk";
import type { RefObject } from "react";
import { ResponsiveDialog } from "@/components/responsive-dialog";
import { AgentClaims } from "./agent-claims";

export function AccountDetailsDialog({
  agent,
  open,
  onOpenChange,
  returnFocus,
}: {
  agent: AgentView;
  open: boolean;
  onOpenChange: (open: boolean) => void;
  returnFocus: RefObject<HTMLButtonElement | null>;
}) {
  return (
    <ResponsiveDialog
      open={open}
      onOpenChange={onOpenChange}
      returnFocus={returnFocus}
      title="Account details"
      description="Owner authority, custody wallet and account record."
      contentClassName="sm:max-w-lg"
      showDrawerCloseButton
      bodyClassName="pt-2"
    >
      <AgentClaims agent={agent} />
    </ResponsiveDialog>
  );
}
