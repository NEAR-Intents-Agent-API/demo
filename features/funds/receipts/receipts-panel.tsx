"use client";

import type { AgentView } from "@near-intents-agent-api/sdk";
import { Loading, Unavailable } from "@/components/shared/states";
import { StatusPill } from "@/components/shared/status";
import { Button } from "@/components/ui/button";
import { useCatalog } from "@/features/assets";
import { accountTimestamp } from "@/lib/format/date";
import { ReceiptDetails } from "./receipt-details";
import {
  receiptAmountLabel,
  receiptStatusLabel,
  receiptStatusTone,
  receiptTypeLabel,
  receiptUsdLabel,
} from "./receipt-display";
import { useReceipts } from "./use-receipts";

/** Every settled execution of this account, each with a receipt anyone can check against the log. */
export function ReceiptsPanel({ agent }: { agent: AgentView }) {
  const receipts = useReceipts(agent.id);
  const { find } = useCatalog();
  const items = receipts.data?.pages.flatMap((page) => page.data) ?? [];

  if (receipts.isPending) return <Loading rows={3} className="p-4 sm:p-5" />;
  if (receipts.error) {
    return (
      <Unavailable
        code={receipts.error.message}
        onRetry={() => void receipts.refetch()}
        className="m-4 sm:m-5"
      />
    );
  }
  if (items.length === 0) {
    return (
      <p className="px-4 py-4 text-sm text-muted-foreground sm:px-5">
        No settled transfers, withdrawals, swaps, orders or deposits yet
      </p>
    );
  }
  return (
    <div className="min-w-0">
      <ul className="divide-y">
        {items.map((item) => {
          const amount = receiptAmountLabel(item, find);
          const usd = receiptUsdLabel(item);
          return (
            <li
              key={item.correlation_id}
              className="flex flex-wrap items-start justify-between gap-x-4 gap-y-2 px-4 py-4 sm:px-5"
            >
              <div className="min-w-0 space-y-1">
                <p className="text-sm font-medium">{receiptTypeLabel(item)}</p>
                {amount || usd ? (
                  <p className="text-xs text-muted-foreground tabular-nums">
                    {[amount, usd].filter(Boolean).join(" · ")}
                  </p>
                ) : null}
                {item.details.note ? (
                  <p className="break-words text-xs text-muted-foreground">{item.details.note}</p>
                ) : null}
              </div>
              <div className="flex flex-col items-end gap-1">
                <StatusPill tone={receiptStatusTone(item.status)} className="capitalize">
                  {receiptStatusLabel(item.status)}
                </StatusPill>
                <span className="text-xs text-muted-foreground">
                  {accountTimestamp(item.details.settled_at)}
                </span>
              </div>
              <div className="basis-full">
                <ReceiptDetails agentId={agent.id} item={item} />
              </div>
            </li>
          );
        })}
      </ul>
      {receipts.hasNextPage ? (
        <div className="border-t p-3">
          <Button
            variant="outline"
            size="sm"
            disabled={receipts.isFetchingNextPage}
            onClick={() => void receipts.fetchNextPage()}
          >
            Show more
          </Button>
        </div>
      ) : null}
    </div>
  );
}
