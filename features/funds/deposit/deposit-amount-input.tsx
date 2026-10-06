import { type CatalogOption, formatUsd, TokenIcon, usdValue } from "@/features/assets";

export function DepositAmountInput({
  token,
  amount,
  onAmount,
  atomic,
}: {
  token: CatalogOption | null;
  amount: string;
  onAmount: (value: string) => void;
  atomic: bigint | null;
}) {
  const usd = token && atomic ? formatUsd(usdValue(atomic, token)) : null;
  return (
    <div className="flex min-h-14 items-center gap-3 rounded-md border border-transparent bg-input/25 px-3 py-2.5 has-[input:focus-visible]:border-primary">
      <div className="min-w-0 flex-1">
        <input
          inputMode="decimal"
          autoComplete="off"
          placeholder="0"
          aria-label="Deposit amount"
          value={amount}
          onChange={(event) => onAmount(event.target.value.replace(/[^0-9.]/g, ""))}
          className="w-full min-w-0 bg-transparent text-2xl font-medium tracking-tight tabular-nums outline-none placeholder:text-muted-foreground/50"
        />
        {usd ? <p className="mt-0.5 text-xs text-muted-foreground tabular-nums">{usd}</p> : null}
      </div>
      <span className="shrink-0">
        {token ? (
          <span className="inline-flex items-center gap-3 text-sm font-medium">
            <TokenIcon
              assetId={token.assetId}
              symbol={token.symbol}
              chain={token.chain}
              size="md"
            />
            {token.symbol}
          </span>
        ) : null}
      </span>
    </div>
  );
}
