"use client";

import type { BalanceLookup } from "@/features/assets";
import { TokenPicker } from "@/features/assets";
import { formatDisplay, formatUnits, fractionOf } from "@/lib/format/amount";
import { cn } from "@/lib/utils";
import type { TokenOption } from "../use-funds";

/**
 * "You pay / You get" row: a large amount on the left, the token pill on the right, and the
 * balance underneath with quick fractions. It is the one control every flow shares, so amounts
 * look and behave identically whether you swap, send or withdraw.
 */
export function AmountField({
  label,
  token,
  onToken,
  tokens,
  balances,
  amount,
  onAmount,
  readOnly,
  hint,
  error,
  showQuickFill = false,
  disabled,
  embedded = false,
}: {
  label: string;
  token: TokenOption | null;
  onToken: (token: TokenOption) => void;
  tokens: readonly TokenOption[];
  balances?: BalanceLookup;
  amount: string;
  onAmount?: (value: string) => void;
  readOnly?: boolean;
  hint?: React.ReactNode;
  error?: string | null;
  showQuickFill?: boolean;
  disabled?: boolean;
  embedded?: boolean;
}) {
  const held = token ? balances?.get(token.assetId) : undefined;
  const fill = (basisPoints: number) => {
    if (!held || !token) return;
    onAmount?.(formatUnits(fractionOf(held.raw, basisPoints).toString(), token.decimals));
  };
  return (
    <div
      className={cn(
        "p-4",
        !embedded &&
          "rounded-lg border border-transparent bg-input/25 transition-colors has-[input:focus-visible]:border-primary",
        error && "border-destructive/50",
      )}
    >
      <div className="mb-2 flex items-center justify-between gap-2">
        <span className="console-eyebrow">{label}</span>
        {showQuickFill && held && held.raw > 0n ? (
          <span className="flex items-center gap-1">
            {[
              ["25%", 2_500],
              ["50%", 5_000],
              ["Max", 10_000],
            ].map(([text, points]) => (
              <button
                key={text}
                type="button"
                disabled={disabled}
                onClick={() => fill(points as number)}
                className="px-1 py-0.5 text-[11px] font-medium text-primary underline-offset-4 hover:underline"
              >
                {text}
              </button>
            ))}
          </span>
        ) : null}
      </div>
      <div className="flex items-center gap-3">
        <input
          inputMode="decimal"
          autoComplete="off"
          spellCheck={false}
          placeholder="0"
          aria-label={`${label} amount`}
          value={amount}
          readOnly={readOnly}
          disabled={disabled}
          onChange={(event) => onAmount?.(event.target.value.replace(/[^0-9.,]/g, ""))}
          className="min-w-0 flex-1 bg-transparent text-3xl font-medium tracking-tight tabular-nums outline-none placeholder:text-muted-foreground/50"
        />
        <TokenPicker
          value={token}
          onChange={onToken}
          tokens={tokens}
          balances={balances}
          disabled={disabled}
          title="Choose a token"
          description="Search by symbol, asset id or network."
        />
      </div>
      {hint || held ? (
        <div className="mt-3 flex flex-wrap items-center justify-between gap-2 text-xs text-muted-foreground">
          <span>{hint}</span>
          {held && token ? (
            <span className="tabular-nums">
              Balance {formatDisplay(held.raw.toString(), held.decimals)} {token.symbol}
            </span>
          ) : null}
        </div>
      ) : null}
      {error ? <p className="mt-1 text-xs text-destructive">{error}</p> : null}
    </div>
  );
}
