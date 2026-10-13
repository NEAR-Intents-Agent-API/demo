import { usdValue } from "@/features/assets";
import type { Holding } from "../use-funds";

/** Dollar value of one holding; null when the price or the token's decimals are unknown. */
export function holdingUsd(holding: Holding): number | null {
  if (holding.priceUsd === null || holding.decimals === null) return null;
  return usdValue(holding.raw, { decimals: holding.decimals, priceUsd: holding.priceUsd });
}

export type PortfolioTotal = {
  /** Sum of the holdings that have a usable price. */
  usd: number;
  /** Held assets with no usable price: left out of `usd`, not counted as $0. */
  unpriced: number;
  /** Oldest price update among the priced holdings: how stale the total can be. */
  asOf: string | null;
};

export function portfolioTotal(holdings: readonly Holding[]): PortfolioTotal {
  let usd = 0;
  let unpriced = 0;
  let asOf: string | null = null;
  for (const holding of holdings) {
    if (holding.raw <= 0n) continue;
    const value = holdingUsd(holding);
    if (value === null) {
      unpriced += 1;
      continue;
    }
    usd += value;
    if (holding.priceUpdatedAt && (asOf === null || holding.priceUpdatedAt < asOf))
      asOf = holding.priceUpdatedAt;
  }
  return { usd, unpriced, asOf };
}

/** Totals add up across balances; the unpriced count and the oldest price carry over. */
export function combineTotals(...totals: readonly PortfolioTotal[]): PortfolioTotal {
  return totals.reduce<PortfolioTotal>(
    (sum, total) => ({
      usd: sum.usd + total.usd,
      unpriced: sum.unpriced + total.unpriced,
      asOf:
        sum.asOf === null || (total.asOf !== null && total.asOf < sum.asOf) ? total.asOf : sum.asOf,
    }),
    { usd: 0, unpriced: 0, asOf: null },
  );
}
