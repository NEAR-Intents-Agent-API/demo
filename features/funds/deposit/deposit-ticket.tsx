"use client";

import { Alert02Icon } from "@hugeicons/core-free-icons";
import { HugeiconsIcon } from "@hugeicons/react";
import { CopyButton } from "@/components/shared/identifiers";
import { pick } from "../model/quote";
import { OperationTracker } from "../operations/operation-tracker";
import { useOperation } from "../operations/use-operation";

/**
 * A deposit waiting for funds: the one-time address, its deadline, and the live status. The
 * address comes from the operation itself (`details.deposit_address`), so a reload or another tab
 * shows the same one rather than creating a second.
 */
export function DepositTicket({
  agentId,
  operationId,
  title,
  onDone,
  onOpenActivity,
}: {
  agentId: string;
  operationId: string;
  title: string;
  onDone: () => void;
  onOpenActivity: () => void;
}) {
  const { operation } = useOperation(agentId, operationId);
  const details = (operation.data?.details ?? null) as Record<string, unknown> | null;
  const address = pick(details, ["deposit_address"]);
  const expires = pick(details, ["expires_at", "deadline"]);
  // Until the deposit settles the address is the one thing to act on, whatever the status says.
  const waiting = !["SUCCESS", "FAILED", "REFUNDED", "NEEDS_REVIEW"].includes(
    operation.data?.status ?? "",
  );

  return (
    <OperationTracker
      agentId={agentId}
      operationId={operationId}
      initialStatus="PENDING_DEPOSIT"
      title={`Deposit ${title}`}
      onDone={onDone}
      onOpenActivity={onOpenActivity}
    >
      {address && waiting ? (
        <div className="flex flex-col gap-3 rounded-md bg-muted/40 p-4">
          <div className="flex items-start gap-3">
            <div className="min-w-0 flex-1">
              <p className="text-xs text-muted-foreground">Send exactly {title} to</p>
              <p className="console-id mt-1 text-sm break-all text-foreground">{address}</p>
            </div>
            <CopyButton
              value={address}
              label="Copy deposit address"
              className="size-9 shrink-0 rounded-md border bg-card"
            />
          </div>
          <p className="flex items-start gap-2 text-xs leading-5 text-muted-foreground">
            <HugeiconsIcon icon={Alert02Icon} className="mt-0.5 size-3.5 shrink-0 text-warning" />
            Use this address once, for this token and network only
            {expires ? `, before ${new Date(expires).toLocaleString()}` : ""}.
          </p>
        </div>
      ) : null}
    </OperationTracker>
  );
}
