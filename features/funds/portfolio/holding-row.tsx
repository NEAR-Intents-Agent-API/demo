"use client";

import { chainInfo, TokenIcon } from "@/features/assets";
import { formatDisplay } from "@/lib/format/amount";
import type { Holding } from "../use-funds";

/** One held token: symbol over chain, amount over its dollar value. */
export function HoldingRow({ holding, usd }: { holding: Holding; usd: number | null }) {
  return (
    <li className="flex items-center gap-3 rounded-lg px-2 py-2.5">
      <TokenIcon
        assetId={holding.assetId}
        symbol={holding.symbol}
        chain={holding.chain}
        size="lg"
      />
      <div className="flex min-w-0 flex-1 flex-col">
        <span className="truncate text-sm font-medium">{holding.symbol}</span>
        <span className="truncate text-xs text-muted-foreground">
          {chainInfo(holding.chain).name}
        </span>
      </div>
      <div className="text-right">
        <p className="text-sm font-medium tabular-nums">
          {formatDisplay(holding.raw.toString(), holding.decimals)}
        </p>
        <p className="text-[11px] text-muted-foreground tabular-nums">
          {holding.decimals === null ? "raw units" : (usd ?? "")}
        </p>
      </div>
    </li>
  );
}
