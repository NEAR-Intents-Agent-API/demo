import { formatDisplay } from "@/lib/format/amount";
import { ReviewCard } from "../flows/review-card";
import { isAtomic, type OrderPreview, pick } from "../model/quote";
import type { TokenOption } from "../use-funds";
import type { OrderSide } from "./use-place-order";

/** What the API says the order spends and the least a full fill delivers, in token units. */
export function OrderReview({
  side,
  base,
  quote,
  preview,
}: {
  side: OrderSide;
  base: TokenOption;
  quote: TokenOption;
  preview: OrderPreview;
}) {
  const spent = side === "sell" ? base : quote;
  const received = side === "sell" ? quote : base;
  const spend = pick(preview.quote, ["spend_amount"]);
  const receive = pick(preview.quote, ["min_amount_out"]);
  const rows: { label: string; value: string }[] = [];
  if (isAtomic(spend))
    rows.push({
      label: "Locked in the order",
      value: `${formatDisplay(spend, spent.decimals)} ${spent.symbol}`,
    });
  if (isAtomic(receive))
    rows.push({
      label: "Delivered by a full fill",
      value: `at least ${formatDisplay(receive, received.decimals)} ${received.symbol}`,
    });
  if (preview.spendUsd)
    rows.push({ label: "Worth", value: `$${Number(preview.spendUsd).toFixed(2)}` });
  return (
    <>
      <ReviewCard rows={rows} />
      <p className="text-xs leading-5 text-muted-foreground">
        The order is funded in full now and rests until it fills, you cancel it or it expires.
        Unfilled funds return to the balance they came from. 1Click adds its own 0.2% fee to every
        order.
      </p>
    </>
  );
}
