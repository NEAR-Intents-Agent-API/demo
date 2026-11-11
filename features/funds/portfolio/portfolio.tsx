"use client";

import { Button } from "@/components/ui/button";
import { cn } from "@/lib/utils";
import type { Holding } from "../use-funds";
import { PortfolioAssetsDialog } from "./portfolio-assets-dialog";
import { PortfolioLaneSwitch } from "./portfolio-lane-switch";
import { PortfolioSummary } from "./portfolio-summary";
import { combineTotals, portfolioTotal } from "./portfolio-total";
import { usePortfolioDialog } from "./use-portfolio-dialog";

export type Lane = "public" | "confidential";

/** Balance summary and a read-only asset viewer share the existing holdings query. */
export function Portfolio({
  lane,
  onLane,
  laneDisabled = false,
  holdings,
  loading,
  error,
  onRetry,
  account,
  allHoldings,
  onManageFunds,
  fundsOpen = false,
  onAddFunds,
  embedded = false,
  showLaneSwitch = true,
  onLegacyAction,
}: {
  lane: Lane;
  onLane: (lane: Lane) => void;
  laneDisabled?: boolean;
  holdings: readonly Holding[];
  loading: boolean;
  error: string | null;
  onRetry: () => void;
  account: string | undefined;
  /** Both balances, once both have loaded, for the combined total. */
  allHoldings: Record<Lane, readonly Holding[]> | null;
  onManageFunds?: () => void;
  fundsOpen?: boolean;
  onAddFunds?: () => void;
  embedded?: boolean;
  showLaneSwitch?: boolean;
  /** The legacy public balance can only be shielded or withdrawn. */
  onLegacyAction?: (action: "shield" | "withdraw") => void;
}) {
  const assets = usePortfolioDialog();
  const visible = holdings.filter((holding) => holding.raw > 0n);
  const total = portfolioTotal(visible);
  const combined = allHoldings
    ? combineTotals(portfolioTotal(allHoldings.public), portfolioTotal(allHoldings.confidential))
    : null;

  return (
    <div className={cn("min-w-0", !embedded && "rounded-xl border bg-card p-4")}>
      <PortfolioSummary
        total={total}
        combined={combined}
        count={visible.length}
        lane={lane}
        loading={loading}
        error={error}
        onManageFunds={onManageFunds}
        onAddFunds={onAddFunds}
        fundsOpen={fundsOpen}
        disabled={laneDisabled}
        onViewAssets={assets.show}
        assetsOpen={assets.open}
      >
        {showLaneSwitch ? (
          <PortfolioLaneSwitch
            lane={lane}
            onLane={onLane}
            disabled={laneDisabled}
            className="w-full"
          />
        ) : null}
      </PortfolioSummary>
      {lane === "public" && onLegacyAction ? (
        <div className="mt-4 flex flex-col gap-2">
          <p className="text-xs leading-5 text-muted-foreground">
            This balance is read-only. Everything the account does now runs on the confidential
            balance, so funds left here can only be shielded or withdrawn.
          </p>
          <div className="flex gap-2">
            <Button
              size="sm"
              className="flex-1"
              disabled={laneDisabled}
              onClick={() => onLegacyAction("shield")}
            >
              Shield
            </Button>
            <Button
              size="sm"
              variant="outline"
              className="flex-1"
              disabled={laneDisabled}
              onClick={() => onLegacyAction("withdraw")}
            >
              Withdraw
            </Button>
          </div>
        </div>
      ) : null}
      <PortfolioAssetsDialog
        open={assets.open}
        onOpenChange={assets.setOpen}
        lane={lane}
        holdings={holdings}
        loading={loading}
        error={error}
        onRetry={onRetry}
        account={account}
      />
    </div>
  );
}
