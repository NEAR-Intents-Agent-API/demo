"use client";

import type { ReactNode } from "react";
import { ResponsiveDialog } from "@/components/responsive-dialog";
import { Button } from "@/components/ui/button";
import { useDetailsDialog } from "@/hooks/use-details-dialog";

export function DetailsDialog({
  title,
  description,
  children,
}: {
  title: string;
  description: string;
  children: ReactNode;
}) {
  const dialog = useDetailsDialog();
  return (
    <>
      <Button
        ref={dialog.triggerRef}
        type="button"
        variant="ghost"
        size="sm"
        className="-my-1 -ml-3 text-muted-foreground"
        aria-label={`Details: ${title}`}
        aria-haspopup="dialog"
        aria-expanded={dialog.open}
        onClick={() => dialog.setOpen(true)}
      >
        Details
      </Button>
      <ResponsiveDialog
        open={dialog.open}
        onOpenChange={dialog.setOpen}
        returnFocus={dialog.triggerRef}
        title={title}
        description={description}
        descriptionClassName="sr-only"
        contentClassName="sm:max-w-md"
        showDrawerCloseButton
      >
        {children}
      </ResponsiveDialog>
    </>
  );
}
