import { formatDisplay } from "@/lib/format/amount";
import { QuoteDetails, ReviewCard } from "../flows/review-card";
import type { ProviderQuote } from "../model/quote";
import type { TokenOption } from "../use-funds";
import { SLIPPAGE_BP } from "./use-swap-flow";

export function SwapReview({
  token,
  to,
  atomic,
  outAtomic,
  minimum,
  quote,
}: {
  token: TokenOption;
  to: TokenOption;
  atomic: bigint;
  outAtomic: bigint;
  /** The least the swap asks for, under the quote's guaranteed output. */
  minimum: bigint;
  quote: ProviderQuote | null;
}) {
  const perUnit = (outAtomic * 10n ** BigInt(token.decimals)) / atomic;
  return (
    <>
      <ReviewCard
        rows={[
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
