"use client";

import type { ReactNode } from "react";
import { ResponsiveDialog } from "@/components/responsive-dialog";
import { DialogBusyContext } from "@/components/shared/dialog-busy-context";
import { DialogFooterContext } from "@/components/shared/dialog-footer-context";
import { useDialogBusyTarget } from "@/hooks/use-dialog-busy";
import { useDialogFooterTarget } from "@/hooks/use-dialog-footer-target";

export function AccountSetupDialogFrame({
  title,
  description,
  busy = false,
  onClose,
  children,
}: {
  title: string;
  description: string;
  busy?: boolean;
  onClose: () => void;
  children: ReactNode;
}) {
  const { footerTarget, setFooterTarget } = useDialogFooterTarget();
  const { locked, value } = useDialogBusyTarget(busy);
  return (
    <DialogFooterContext.Provider value={footerTarget}>
      <DialogBusyContext.Provider value={value}>
        <ResponsiveDialog
          open
          busy={locked}
          onOpenChange={(open) => {
            if (!open && !locked) onClose();
          }}
          title={title}
          description={description}
          descriptionClassName="sr-only"
          showDrawerCloseButton
          contentClassName="sm:max-w-xl"
          bodyClassName="flex flex-col gap-4 pt-2"
          footer={<div ref={setFooterTarget} />}
        >
          {children}
        </ResponsiveDialog>
      </DialogBusyContext.Provider>
    </DialogFooterContext.Provider>
  );
}
