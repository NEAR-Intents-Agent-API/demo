"use client";
import { type CatalogOption, TokenPicker } from "@/features/assets";

export function DepositTokenChoice({
  tokens,
  value,
  onChange,
  disabled,
}: {
  tokens: readonly CatalogOption[];
  value: string | null;
  onChange: (assetId: string) => void;
  disabled?: boolean;
}) {
  if (tokens.length === 0)
    return (
      <p className="rounded-lg border border-dashed px-4 py-3 text-sm text-muted-foreground">
        This agent&rsquo;s rules allow no token on this network.
      </p>
    );
  return (
    <TokenPicker
      tokens={tokens}
      value={tokens.find((token) => token.assetId === value) ?? null}
      onChange={(token) => onChange(token.assetId)}
      disabled={disabled}
      className="h-12 w-full [&>svg:last-child]:ml-auto"
    />
  );
}
