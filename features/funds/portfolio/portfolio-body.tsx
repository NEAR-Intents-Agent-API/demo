"use client";

import { Unavailable } from "@/components/shared/states";
import type { Holding } from "../use-funds";
import { HoldingRow } from "./holding-row";
import type { Lane } from "./portfolio";
import { PrivateEmpty } from "./private-empty";
import { PublicEmpty } from "./public-empty";

export function PortfolioBody({
  lane,
  visible,
  loading,
  error,
  onRetry,
  usdOf,
}: {
  lane: Lane;
  visible: readonly Holding[];
  loading: boolean;
  error: string | null;
  onRetry: () => void;
  usdOf: (holding: Holding) => number | null;
}) {
  if (loading) {
    return (
      <ul className="flex flex-col gap-1" aria-busy="true">
        {["a", "b", "c"].map((key) => (
          <li key={key} className="h-14 animate-pulse rounded-lg bg-muted/50" />
        ))}
      </ul>
    );
  }
  if (error) return <Unavailable code={error} onRetry={onRetry} className="m-2" />;
  if (visible.length === 0) {
    return lane === "confidential" ? <PrivateEmpty /> : <PublicEmpty />;
  }
  return (
    <ul className="flex flex-col">
      {visible.map((holding) => (
        <HoldingRow key={holding.assetId} holding={holding} usd={usdOf(holding)} />
      ))}
    </ul>
  );
}
