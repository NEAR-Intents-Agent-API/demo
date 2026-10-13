"use client";
import { chainInfo } from "@/features/assets";
import { formatDisplay } from "@/lib/format/amount";
import { QuoteDetails, ReviewCard } from "../flows/review-card";
import { isAtomic, withdrawFacts } from "../model/quote";
import type { TokenOption } from "../use-funds";

export function WithdrawReview({
  lane,
  token,
  atomic,
  network,
  recipient,
  loading,
  quote,
}: {
  lane: "public" | "private";
  token: TokenOption;
  atomic: bigint;
  network: string;
  recipient: string;
  loading: boolean;
  quote: Record<string, unknown> | null;
}) {
  const facts = withdrawFacts(quote);
  const show = (raw: string) => `${formatDisplay(raw, token.decimals)} ${token.symbol}`;
  // A fee in the withdrawn token reads in its units; one in another asset is shown as stated.
  const feeInToken =
    facts.fee !== null &&
    isAtomic(facts.fee.value) &&
    (facts.fee.token === null ||
      facts.fee.token === token.assetId ||
      facts.fee.token === token.defuseAssetId);
  const feeText = facts.fee
    ? feeInToken
      ? show(facts.fee.value)
      : `${facts.fee.value}${facts.fee.token ? ` (${facts.fee.token})` : ""}`
    : "Not quoted";
  return (
    <>
      <ReviewCard
        rows={[
          { label: "Balance", value: lane === "private" ? "Private balance" : "Public balance" },
          { label: "You withdraw", value: show(atomic.toString()), emphasis: true },
          {
            label: "You receive",
            value: loading
              ? "Checking fees…"
              : isAtomic(facts.received)
                ? show(facts.received)
                : "Shown after the bridge accepts",
          },
          ...(isAtomic(facts.minimumReceived)
            ? [{ label: "Minimum received", value: show(facts.minimumReceived) }]
            : []),
          ...(isAtomic(facts.minimumAmount)
            ? [{ label: "Minimum withdrawal", value: show(facts.minimumAmount) }]
            : []),
          { label: "Fee", value: loading ? "Checking fees…" : feeText },
          { label: "Network", value: chainInfo(network).name },
          { label: "To", value: <span className="console-id">{recipient}</span> },
        ]}
      />
      <QuoteDetails quote={quote} />
    </>
  );
}
