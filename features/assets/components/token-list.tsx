"use client";
import { Search01Icon } from "@hugeicons/core-free-icons";
import { HugeiconsIcon } from "@hugeicons/react";
import { Input } from "@/components/ui/input";
import { formatDisplay } from "@/lib/format/amount";
import { chainInfo } from "../chains";
import { useTokenList } from "../hooks/use-token-list";
import type { TokenOption } from "../types";
import { NetworkFilterDropdown } from "./network-filter-dropdown";
import type { BalanceLookup } from "./picker-types";
import { TokenIcon } from "./token-icon";

const ROW_CAP = 80;

export function TokenList({
  tokens,
  balances,
  selected,
  onPick,
}: {
  tokens: readonly TokenOption[];
  balances?: BalanceLookup;
  selected?: string;
  onPick: (token: TokenOption) => void;
}) {
  const { query, setQuery, chain, setChain, chains, filtered } = useTokenList(tokens, balances);

  return (
    <div className="flex min-h-0 min-w-0 flex-col gap-3">
      <div className="relative">
        <HugeiconsIcon
          icon={Search01Icon}
          className="pointer-events-none absolute top-1/2 left-3 size-4 -translate-y-1/2 text-muted-foreground"
        />
        <Input
          aria-label="Search tokens"
          autoFocus
          value={query}
          onChange={(event) => setQuery(event.target.value)}
          placeholder="Search by name or asset id"
          className="h-10 pl-9"
        />
      </div>

      {chains.length > 1 ? (
        <NetworkFilterDropdown chains={chains} value={chain} onChange={setChain} />
      ) : null}

      <ul className="flex max-h-[min(24rem,50dvh)] flex-col overflow-y-auto">
        {filtered.slice(0, ROW_CAP).map((token) => {
          const held = balances?.get(token.assetId);
          return (
            <li key={token.assetId}>
              <button
                type="button"
                onClick={() => onPick(token)}
                aria-pressed={selected === token.assetId}
                className="flex h-14 w-full cursor-pointer items-center gap-3 rounded-lg px-2 py-2 text-left text-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-inset focus-visible:ring-ring/50"
              >
                <TokenIcon
                  assetId={token.assetId}
                  symbol={token.symbol}
                  chain={token.chain}
                  size="lg"
                />
                <span className="flex min-w-0 flex-1 flex-col">
                  <span className="truncate text-sm font-medium">{token.symbol}</span>
                  <span className="truncate text-xs text-muted-foreground">
                    {chainInfo(token.chain).name}
                    {token.chains.length > 1 ? ` · +${token.chains.length - 1} more` : ""}
                  </span>
                </span>
                {held && held.raw > 0n ? (
                  <span className="text-sm tabular-nums">
                    {formatDisplay(held.raw.toString(), held.decimals)}
                  </span>
                ) : null}
              </button>
            </li>
          );
        })}
        {filtered.length === 0 ? (
          <li className="px-2 py-8 text-center text-sm text-muted-foreground">
            No token matches “{query}”.
          </li>
        ) : null}
        {filtered.length > ROW_CAP ? (
          <li className="px-2 py-3 text-center text-xs text-muted-foreground">
            Showing {ROW_CAP} of {filtered.length}. Search to narrow it down.
          </li>
        ) : null}
      </ul>
    </div>
  );
}
