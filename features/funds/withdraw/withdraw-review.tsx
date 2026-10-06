"use client";
import { chainInfo } from "@/features/assets";
import { formatDisplay } from "@/lib/format/amount";
import { QuoteDetails, ReviewCard } from "../flows/review-card";
import { isAtomic, pick } from "../model/quote";
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
  const received = pick(quote, ["amount_received", "amount_out", "receive_amount"]);
  const fee = pick(quote, ["fee", "fee_amount", "withdrawal_fee", "network_fee"]);
  const show = (raw: string) => `${formatDisplay(raw, token.decimals)} ${token.symbol}`;
  const receiveText = isAtomic(received) ? show(received) : "Shown after the bridge accepts";
  return (
    <>
      <ReviewCard
        rows={[
          { label: "Balance", value: lane === "private" ? "Private balance" : "Public balance" },
          { label: "You withdraw", value: show(atomic.toString()), emphasis: true },
          { label: "You receive", value: loading ? "Checking fees…" : receiveText },
          ...(isAtomic(fee) ? [{ label: "Network fee", value: show(fee) }] : []),
          { label: "Network", value: chainInfo(network).name },
          { label: "To", value: <span className="console-id">{recipient}</span> },
        ]}
      />
      <QuoteDetails quote={quote} />
    </>
  );
}
