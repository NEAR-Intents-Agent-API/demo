"use client";

import { ResponsiveDialog } from "@/components/responsive-dialog";
import { Pending } from "@/components/shared/states";
import { Button } from "@/components/ui/button";
import { errorMessage } from "@/lib/http/messages";
import { useCancelAllOrders } from "./use-limit-orders";

/** One confirmation, then repeated rounds until the API reports every resting order cancelled. */
export function CancelAllDialog({ agentId, onClose }: { agentId: string; onClose: () => void }) {
  const cancelAll = useCancelAllOrders(agentId);
  const result = cancelAll.data;
  return (
    <ResponsiveDialog
      open
      busy={cancelAll.isPending}
      onOpenChange={(open) => {
        if (!open) onClose();
      }}
      title="Cancel all open orders?"
      description="Every resting order is cancelled and what is unfilled returns to the balance that funded it."
      contentClassName="sm:max-w-md"
      footer={
        <div className="flex flex-col gap-3">
          {cancelAll.error ? (
            <p role="alert" className="text-sm text-destructive">
              {errorMessage(cancelAll.error)}
            </p>
          ) : null}
          {result ? (
            <p role="status" className="text-sm text-muted-foreground">
              {result.complete
                ? `Cancelled ${result.cancelled} ${result.cancelled === 1 ? "order" : "orders"}.`
                : `Cancelled ${result.cancelled}; ${result.remaining} could not be cancelled yet. Try again in a moment.`}
              {result.failed > 0 ? ` ${result.failed} failed.` : ""}
            </p>
          ) : null}
          <div className="flex flex-col-reverse gap-2 sm:flex-row sm:justify-end">
            <Button variant="outline" disabled={cancelAll.isPending} onClick={onClose}>
              {result?.complete ? "Close" : "Keep orders"}
            </Button>
            {result?.complete ? null : (
              <Button
                variant="destructive"
                disabled={cancelAll.isPending}
                onClick={() => cancelAll.mutate()}
              >
                {cancelAll.isPending ? <Pending /> : null}
                Cancel all orders
              </Button>
            )}
          </div>
        </div>
      }
    >
      <p className="text-sm leading-6 text-muted-foreground">
        Cancelling spends nothing and needs no delay or approval, and it works even while the
        account is frozen. The USD budget an order used when it was placed is not given back.
      </p>
    </ResponsiveDialog>
  );
}
