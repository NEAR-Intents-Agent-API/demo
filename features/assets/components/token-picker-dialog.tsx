"use client";
import { ResponsiveDialog } from "@/components/responsive-dialog";
import type { TokenOption } from "../types";
import type { BalanceLookup } from "./picker-types";
import { TokenList } from "./token-list";

export function TokenPickerDialog({
  open,
  onOpenChange,
  title,
  description,
  ...list
}: {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  title: string;
  description?: string;
  tokens: readonly TokenOption[];
  balances?: BalanceLookup;
  selected?: string;
  onPick: (token: TokenOption) => void;
}) {
  return (
    <ResponsiveDialog
      open={open}
      onOpenChange={onOpenChange}
      title={title}
      description={description ?? "Search tokens and filter by network."}
      contentClassName="overflow-x-hidden sm:max-w-md"
    >
      <TokenList {...list} />
    </ResponsiveDialog>
  );
}
