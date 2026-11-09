import type { LimitOrderView } from "@near-intents-agent-api/sdk";
import { formatDisplay } from "@/lib/format/amount";

type Known = { symbol: string; decimals: number };
type Find = (asset: string) => Known | undefined;

/** `fill_status` values at which a fill, refund or cancel can still land: the order is not over. */
const RESTING_STATUSES = new Set(["awaiting_deposit", "open", "partially_filled"]);

const FILL_LABELS: Readonly<Record<string, string>> = {
  awaiting_deposit: "Funding",
  open: "Resting",
  partially_filled: "Partly filled",
  filled: "Filled",
  canceled: "Cancelled",
  cancelled: "Cancelled",
  expired: "Expired",
};

export const isResting = (order: LimitOrderView) => RESTING_STATUSES.has(order.fill_status ?? "");

export function fillStatusLabel(status: string | undefined): string {
  if (!status) return "Unknown";
  return FILL_LABELS[status] ?? status.replaceAll("_", " ").toLowerCase();
}

export function fillStatusTone(status: string | undefined): "ok" | "attention" | "neutral" {
  if (status === "filled") return "ok";
  if (status && RESTING_STATUSES.has(status)) return "attention";
  return "neutral";
}

/** "Sell 1.5 NEAR at 5.2 USDC"; the raw asset id stands in for a token the catalogue lacks. */
export function orderTitle(order: LimitOrderView, find: Find): string {
  const base = order.base_asset ? find(order.base_asset) : undefined;
  const quote = order.quote_asset ? find(order.quote_asset) : undefined;
  const verb = order.side === "buy" ? "Buy" : "Sell";
  const amount =
    order.quantity && base
      ? `${formatDisplay(order.quantity, base.decimals)} ${base.symbol}`
      : (base?.symbol ?? order.base_asset ?? "");
  const price = order.price ? ` at ${order.price} ${quote?.symbol ?? order.quote_asset ?? ""}` : "";
  return `${verb} ${amount}${price}`.trim();
}

/** 1Click's app fee on the order, from its basis points: 20 is "0.2%". */
export function appFeeLabel(order: LimitOrderView): string | null {
  const bps = order.app_fees?.reduce((sum, fee) => sum + (fee.fee ?? 0), 0);
  return bps ? `${Number((bps / 100).toFixed(4))}%` : null;
}

export type CancelRound = {
  known: number;
  cancelled: number;
  failed: number;
  remaining: number;
  complete: boolean;
};

/** One round of cancel-all from the funds tool result `{ data: { ... } }`; null when it is not one. */
export function readCancelRound(result: unknown): CancelRound | null {
  const data = (result as { data?: unknown } | null)?.data;
  if (typeof data !== "object" || data === null) return null;
  const round = data as Record<string, unknown>;
  const count = (key: string) =>
    typeof round[key] === "number" && Number.isInteger(round[key]) ? (round[key] as number) : null;
  const known = count("known");
  const cancelled = count("cancelled");
  const failed = count("failed");
  const remaining = count("remaining");
  if (
    known === null ||
    cancelled === null ||
    failed === null ||
    remaining === null ||
    typeof round.complete !== "boolean"
  )
    return null;
  return { known, cancelled, failed, remaining, complete: round.complete };
}
