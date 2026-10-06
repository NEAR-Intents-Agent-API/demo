"use client";
import { ArrowDown01Icon } from "@hugeicons/core-free-icons";
import { HugeiconsIcon } from "@hugeicons/react";
import { cn } from "@/lib/utils";
import { chainInfo } from "../chains";
import { usePickerDialog } from "../hooks/use-picker-dialog";
import type { TokenOption } from "../types";
import type { BalanceLookup } from "./picker-types";
import { TokenIcon } from "./token-icon";
import { TokenPickerDialog } from "./token-picker-dialog";

export function TokenPicker({
  value,
  onChange,
  tokens,
  balances,
  title = "Select a token",
  description,
  placeholder = "Select token",
  disabled,
  className,
}: {
  value: TokenOption | null;
  onChange: (token: TokenOption) => void;
  tokens: readonly TokenOption[];
  balances?: BalanceLookup;
  title?: string;
  description?: string;
  placeholder?: string;
  disabled?: boolean;
  className?: string;
}) {
  const { open, setOpen, pick } = usePickerDialog(onChange);
  return (
    <>
      <button
        type="button"
        disabled={disabled}
        aria-haspopup="dialog"
        aria-expanded={open}
        onClick={() => setOpen(true)}
        className={cn(
          "inline-flex h-11 shrink-0 items-center gap-3 rounded-md border border-transparent bg-input/25 px-3 py-1 text-left shadow-none transition-colors hover:bg-input/35 focus-visible:outline-none focus-visible:border-primary focus-visible:ring-0 disabled:pointer-events-none disabled:opacity-50",
          className,
        )}
      >
        {value ? (
          <>
            <TokenIcon assetId={value.assetId} symbol={value.symbol} chain={value.chain} />
            <span className="flex flex-col leading-tight">
              <span className="text-sm font-medium">{value.symbol}</span>
              <span className="text-[11px] text-muted-foreground">
                {chainInfo(value.chain).name}
              </span>
            </span>
          </>
        ) : (
          <span className="pl-2 text-sm font-medium">{placeholder}</span>
        )}
        <HugeiconsIcon icon={ArrowDown01Icon} className="ml-1 size-4 text-muted-foreground" />
      </button>

      <TokenPickerDialog
        open={open}
        onOpenChange={setOpen}
        title={title}
        description={description}
        tokens={tokens}
        balances={balances}
        selected={value?.assetId}
        onPick={pick}
      />
    </>
  );
}
