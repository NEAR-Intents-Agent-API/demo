"use client";

import { ArrowRight01Icon, PlusSignIcon } from "@hugeicons/core-free-icons";
import { HugeiconsIcon } from "@hugeicons/react";
import { Button } from "@/components/ui/button";
import { formatUsd } from "@/features/assets";
import type { Lane } from "./portfolio";

export function PortfolioSummary({
  total,
  count,
  lane,
  loading,
  error,
  onManageFunds,
  onAddFunds,
  fundsOpen,
  disabled,
  children,
  onViewAssets,
  assetsOpen,
}: {
  total: number;
  count: number;
  lane: Lane;
  loading: boolean;
  error: string | null;
  onManageFunds?: () => void;
  onAddFunds?: () => void;
  fundsOpen: boolean;
  disabled: boolean;
  children?: React.ReactNode;
  onViewAssets: () => void;
  assetsOpen: boolean;
}) {
  let detail = `${count} ${count === 1 ? "asset" : "assets"} in ${lane === "public" ? "public" : "private"} balance`;
  if (error) detail = "Balance unavailable";
  if (loading) detail = "Reading the wallet…";
  return (
    <div className="flex flex-col gap-5">
      {children}
      <div className="min-w-0">
        <div className="flex flex-wrap items-center justify-between gap-x-4 gap-y-1">
          <h2 className="text-sm font-medium text-muted-foreground">Account assets</h2>
          {onManageFunds || onAddFunds ? (
            <Button
              type="button"
              variant="ghost"
              size="sm"
              disabled={disabled}
              aria-haspopup="dialog"
              aria-controls="account-funds-panel"
              aria-expanded={fundsOpen}
              onClick={onAddFunds ?? onManageFunds}
              className="ml-auto gap-1.5 bg-transparent px-0 text-primary hover:bg-transparent hover:text-primary/80 aria-expanded:bg-transparent dark:hover:bg-transparent"
            >
              <HugeiconsIcon icon={PlusSignIcon} className="size-4" />
              Deposit
            </Button>
          ) : null}
        </div>
        <p className="mt-2 text-3xl leading-tight font-medium tracking-tight tabular-nums">
          {loading || error ? "—" : (formatUsd(total) ?? "$0.00")}
        </p>
        <p className="mt-1 text-xs leading-5 text-muted-foreground">{detail}</p>
        <Button
          type="button"
          variant="ghost"
          size="sm"
          onClick={onViewAssets}
          aria-haspopup="dialog"
          aria-expanded={assetsOpen}
          className="mt-2 bg-transparent px-0 text-xs font-normal text-muted-foreground hover:bg-transparent hover:text-foreground aria-expanded:bg-transparent dark:hover:bg-transparent"
        >
          View all assets <HugeiconsIcon icon={ArrowRight01Icon} className="size-3.5" />
        </Button>
      </div>
    </div>
  );
}
