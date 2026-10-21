"use client";
import { chainInfo } from "@/features/assets";
import { canonicalChain } from "@/lib/agent-api/schemas";
import { formatDisplay } from "@/lib/format/amount";
import { QuoteDetails, ReviewCard } from "../flows/review-card";
import { isAtomic, type WithdrawPreview, withdrawFacts } from "../model/quote";
import type { TokenOption } from "../use-funds";

export function WithdrawReview({
  lane,
  token,
  atomic,
  network,
  recipient,
  loading,
  preview,
}: {
  lane: "public" | "private";
  token: TokenOption;
  atomic: bigint;
  network: string;
  recipient: string;
  loading: boolean;
  preview: WithdrawPreview | null;
}) {
  const facts = withdrawFacts(preview);
  const show = (raw: string) => `${formatDisplay(raw, token.decimals)} ${token.symbol}`;
  // A bridged withdrawal's quote counts in the destination chain's asset, which the preview does
  // not name, so its amounts cannot be read in the withdrawn token's units.
  const bridged = canonicalChain(network) !== "near";
  const delivered = (raw: string) =>
    bridged ? `${raw} atomic units, in the destination chain's asset` : show(raw);
  const feeText = facts.fee
    ? `$${facts.fee.amount_usd} (${facts.fee.percent}%)`
    : "Not valued on this route. Compare what you withdraw with what you receive.";
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
                ? delivered(facts.received)
                : "Shown after the bridge accepts",
          },
          ...(isAtomic(facts.minimumReceived)
            ? [{ label: "Minimum received", value: delivered(facts.minimumReceived) }]
            : []),
          ...(isAtomic(facts.minimumAmount)
            ? [{ label: "Minimum withdrawal", value: show(facts.minimumAmount) }]
            : []),
          { label: "Fee", value: loading ? "Checking fees…" : feeText },
          { label: "Network", value: chainInfo(network).name },
          { label: "To", value: <span className="console-id">{recipient}</span> },
        ]}
      />
      <QuoteDetails quote={preview?.quote ?? null} />
    </>
  );
}
