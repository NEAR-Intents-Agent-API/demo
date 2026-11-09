"use client";

import { ResponsiveDialog } from "@/components/responsive-dialog";
import { PlaceOrderFlow } from "./place-order-flow";
import { usePlaceOrder } from "./use-place-order";

/**
 * Mounted only while open, so closing it drops the draft. Closing is blocked while the order is
 * being submitted, like every other money flow.
 */
export function PlaceOrderDialog({ onClose }: { onClose: () => void }) {
  const view = usePlaceOrder();
  return (
    <ResponsiveDialog
      open
      hideWhenNested
      busy={view.action.isPending}
      onOpenChange={(open) => {
        if (!open) onClose();
      }}
      title="Place a limit order"
      description="An order that rests at the price you set and fills when the market reaches it."
      contentClassName="sm:max-w-md sm:overflow-visible"
      showDrawerCloseButton
    >
      <PlaceOrderFlow view={view} onDone={onClose} />
    </ResponsiveDialog>
  );
}
