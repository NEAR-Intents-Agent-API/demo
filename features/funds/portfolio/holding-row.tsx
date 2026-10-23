"use client";

import { chainInfo, formatUsd, TokenIcon } from "@/features/assets";
import { formatDisplay } from "@/lib/format/amount";
import { accountTime } from "@/lib/format/date";
import type { Holding } from "../use-funds";
import { holdingUsd } from "./portfolio-total";

function valueLine(holding: Holding): string {
  if (holding.decimals === null) return "raw units";
  const usd = formatUsd(holdingUsd(holding));
  if (usd === null) return holding.priceExpired ? "Price expired" : "No price";
  return holding.priceUpdatedAt ? `${usd} · ${accountTime(holding.priceUpdatedAt)}` : usd;
}

/** One held token: symbol over chain, amount over its dollar value and how fresh that price is. */
export function HoldingRow({ holding }: { holding: Holding }) {
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
        <p className="text-[11px] text-muted-foreground tabular-nums">{valueLine(holding)}</p>
        {holding.available < holding.raw ? (
          <p className="text-[11px] text-muted-foreground tabular-nums">
            {formatDisplay(holding.available.toString(), holding.decimals)} available, the rest is
            held by queued requests
          </p>
        ) : null}
      </div>
    </li>
  );
}
