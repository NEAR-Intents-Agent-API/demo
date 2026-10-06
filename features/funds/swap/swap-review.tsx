import { formatDisplay, fractionOf } from "@/lib/format/amount";
import { QuoteDetails, ReviewCard } from "../flows/review-card";
import type { TokenOption } from "../use-funds";
import { SLIPPAGE_BP } from "./use-swap-flow";

export function SwapReview({
  lane,
  token,
  to,
  atomic,
  outAtomic,
  quote,
}: {
  lane: "public" | "private";
  token: TokenOption;
  to: TokenOption;
  atomic: bigint;
  outAtomic: bigint;
  quote: Record<string, unknown> | null;
}) {
  const perUnit = (outAtomic * 10n ** BigInt(token.decimals)) / atomic;
  const minimum = fractionOf(outAtomic, 10_000 - SLIPPAGE_BP);
  return (
    <>
      <ReviewCard
        rows={[
          { label: "Balance", value: lane === "private" ? "Private balance" : "Public balance" },
          {
            label: "Rate",
            value: `1 ${token.symbol} ≈ ${formatDisplay(perUnit.toString(), to.decimals)} ${to.symbol}`,
          },
          {
            label: "Minimum received",
            value: `${formatDisplay(minimum.toString(), to.decimals)} ${to.symbol}`,
          },
          { label: "Slippage", value: `${SLIPPAGE_BP / 100}%` },
        ]}
      />
      <QuoteDetails quote={quote} />
    </>
  );
}
