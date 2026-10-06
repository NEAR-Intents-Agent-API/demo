import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { type CatalogOption, chainInfo, formatUsd, TokenIcon, usdValue } from "@/features/assets";
import { useTokenLimitField } from "./use-token-limit-field";

export function LimitRow({
  token,
  raw,
  onRaw,
  onRemove,
}: {
  token: CatalogOption;
  raw: string;
  onRaw: (raw: string) => void;
  onRemove: () => void;
}) {
  const { text, atomic, invalid, changeText } = useTokenLimitField(raw, token.decimals, onRaw);
  const usd = atomic ? formatUsd(usdValue(atomic, token)) : null;
  return (
    <li className="grid grid-cols-[auto_minmax(0,1fr)_auto] items-center gap-x-2 gap-y-3 rounded-lg border bg-input/20 p-3">
      <TokenIcon assetId={token.assetId} symbol={token.symbol} chain={token.chain} size="md" />
      <span className="flex min-w-0 flex-1 flex-col leading-tight">
        <span className="truncate text-sm font-medium">{token.symbol}</span>
        <span className="truncate text-[11px] text-muted-foreground">
          {chainInfo(token.chain).name}
        </span>
      </span>
      <Button
        variant="ghost"
        size="sm"
        type="button"
        onClick={onRemove}
        className="text-xs text-muted-foreground"
      >
        Remove
      </Button>
      <span className="col-span-3 flex flex-col gap-1">
        <span className="flex items-center gap-2">
          <Input
            inputMode="decimal"
            aria-label={`Most ${token.symbol} per move`}
            aria-invalid={invalid || undefined}
            value={text}
            placeholder="0"
            onChange={(event) => changeText(event.target.value)}
            className="tabular-nums"
          />
          <span className="shrink-0 text-xs text-muted-foreground">per move</span>
        </span>
        <span className="text-[11px] text-muted-foreground tabular-nums">
          {invalid
            ? "Enter an amount above zero"
            : usd
              ? `≈ ${usd} per move`
              : `Amount in ${token.symbol}`}
        </span>
      </span>
    </li>
  );
}
