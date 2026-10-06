import type { ReactNode } from "react";
import { ResponsiveDialog } from "@/components/responsive-dialog";

export function AccountFundsPanel({
  actions,
  busy,
  onClose,
}: {
  actions: ReactNode;
  busy: boolean;
  onClose: () => void;
}) {
  return (
    <ResponsiveDialog
      open
      hideWhenNested
      busy={busy}
      onOpenChange={(open) => {
        if (!open) onClose();
      }}
      title="Manage funds"
      description="Deposit to this account, or turn on more actions to swap, transfer, withdraw or shield."
      descriptionClassName="sr-only"
      contentClassName="sm:max-w-md sm:overflow-visible"
      showDrawerCloseButton
    >
      <div id="account-funds-panel" className="min-w-0">
        {actions}
      </div>
    </ResponsiveDialog>
  );
}
