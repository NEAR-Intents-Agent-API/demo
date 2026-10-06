"use client";

import { Cancel01Icon } from "@hugeicons/core-free-icons";
import { HugeiconsIcon } from "@hugeicons/react";
import { cn } from "@/lib/utils";
import { chainInfo } from "../chains";
import { TokenIcon } from "./token-icon";

/**
 * One asset as a labelled row: logo with its chain badge, symbol, and the network in small type.
 * The network is spelled out because USDC on Base and USDC on Solana are different assets.
 */
export function TokenChip({
  token,
  onRemove,
  trailing,
  className,
}: {
  token: { assetId: string; symbol: string; chain: string };
  onRemove?: () => void;
  trailing?: React.ReactNode;
  className?: string;
}) {
  return (
    <span
      className={cn(
        "inline-flex max-w-full items-center gap-2 rounded-md text-sm",
        onRemove ? "border bg-card py-1 pl-1 pr-1" : "py-1",
        className,
      )}
      title={token.assetId}
    >
      <TokenIcon assetId={token.assetId} symbol={token.symbol} chain={token.chain} size="sm" />
      <span className="flex min-w-0 items-baseline gap-1.5 leading-none">
        <span className="truncate font-medium">{token.symbol}</span>
        <span className="truncate text-[11px] text-muted-foreground">
          {chainInfo(token.chain).name}
        </span>
      </span>
      {trailing}
      {onRemove ? (
        <button
          type="button"
          aria-label={`Remove ${token.symbol} on ${chainInfo(token.chain).name}`}
          onClick={onRemove}
          className="grid size-6 shrink-0 place-items-center rounded-md text-muted-foreground transition-colors hover:bg-muted hover:text-foreground"
        >
          <HugeiconsIcon icon={Cancel01Icon} className="size-3" />
        </button>
      ) : null}
    </span>
  );
}

/** A plain removable tag for an address or account. */
export function AddressChip({ value, onRemove }: { value: string; onRemove?: () => void }) {
  return (
    <span className="inline-flex max-w-full items-center gap-1 py-1">
      <span className="console-id break-all text-foreground">{value}</span>
      {onRemove ? (
        <button
          type="button"
          aria-label={`Remove ${value}`}
          onClick={onRemove}
          className="grid size-6 shrink-0 place-items-center rounded-md text-muted-foreground transition-colors hover:bg-muted hover:text-foreground"
        >
          <HugeiconsIcon icon={Cancel01Icon} className="size-3" />
        </button>
      ) : null}
    </span>
  );
}
