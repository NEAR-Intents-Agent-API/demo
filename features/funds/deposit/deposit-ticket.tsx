"use client";

import { Alert02Icon } from "@hugeicons/core-free-icons";
import { HugeiconsIcon } from "@hugeicons/react";
import { CopyButton } from "@/components/shared/identifiers";
import type { CatalogOption } from "@/features/assets";
import { formatUnits } from "@/lib/format/amount";
import { pick } from "../model/quote";
import { OperationTracker } from "../operations/operation-tracker";
import { useOperation } from "../operations/use-operation";

/**
 * A deposit waiting for funds: the address, what to send (exactly `details.amount`, or at least
 * `details.min_amount` when no amount was asked for), a memo where the chain needs one, its
 * deadline, and the live status. Everything comes from the operation itself, so a reload or
 * another tab shows the same address rather than creating a second.
 */
export function DepositTicket({
  agentId,
  operationId,
  title,
  token,
  onDone,
  onOpenActivity,
}: {
  agentId: string;
  operationId: string;
  title: string;
  token: Pick<CatalogOption, "symbol" | "decimals">;
  onDone: () => void;
  onOpenActivity: () => void;
}) {
  const { operation } = useOperation(agentId, operationId);
  const details = (operation.data?.details ?? null) as Record<string, unknown> | null;
  const address = pick(details, ["deposit_address"]);
  const expires = pick(details, ["expires_at", "deadline"]);
  const memo = pick(details, ["memo"]);
  const exact = pick(details, ["amount"]);
  const minimum = pick(details, ["min_amount"]);
  const units = (raw: string) => `${formatUnits(raw, token.decimals)} ${token.symbol}`;
  const instruction = exact
    ? `Send exactly ${units(exact)} to`
    : minimum
      ? `Send at least ${units(minimum)} to`
      : `Send ${token.symbol} to`;
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
              <p className="text-xs text-muted-foreground">{instruction}</p>
              <p className="console-id mt-1 text-sm break-all text-foreground">{address}</p>
            </div>
            <CopyButton
              value={address}
              label="Copy deposit address"
              className="size-9 shrink-0 rounded-md border bg-card"
            />
          </div>
          {memo ? (
            <div className="flex items-start gap-3">
              <div className="min-w-0 flex-1">
                <p className="text-xs text-muted-foreground">With this memo</p>
                <p className="console-id mt-1 text-sm break-all text-foreground">{memo}</p>
              </div>
              <CopyButton
                value={memo}
                label="Copy deposit memo"
                className="size-9 shrink-0 rounded-md border bg-card"
              />
            </div>
          ) : null}
          <p className="flex items-start gap-2 text-xs leading-5 text-muted-foreground">
            <HugeiconsIcon icon={Alert02Icon} className="mt-0.5 size-3.5 shrink-0 text-warning" />
            Use this address for this token and network only
            {expires ? `, before ${new Date(expires).toLocaleString()}` : ""}. A failed or late
            deposit is refunded into this agent&apos;s balance.
          </p>
        </div>
      ) : null}
    </OperationTracker>
  );
}
