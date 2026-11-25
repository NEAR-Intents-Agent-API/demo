import type { ReceiptItem } from "@near-intents-agent-api/sdk";
import { formatUsd } from "@/features/assets";
import { canonicalChain } from "@/lib/agent-api/schemas";
import { formatDisplay } from "@/lib/format/amount";
import { humanize } from "../operations/operation-display-utils";

type Find = (asset: string) => { symbol: string; decimals: number } | undefined;

const TYPE_LABELS: Readonly<Record<ReceiptItem["type"], string>> = {
  transfer: "Transfer",
  withdraw: "Withdrawal",
  swap: "Swap",
  limit_order: "Limit order",
  deposit: "Deposit",
};

export function receiptTypeLabel(item: ReceiptItem): string {
  return TYPE_LABELS[item.type];
}

/** PROVEN has a receipt to check; PENDING is not in the log yet; UNLOGGED settled without one. */
export function receiptStatusTone(status: ReceiptItem["status"]): "ok" | "attention" | "neutral" {
  if (status === "PROVEN") return "ok";
  return status === "PENDING" ? "attention" : "neutral";
}

export function receiptStatusLabel(status: ReceiptItem["status"]): string {
  return status === "UNLOGGED" ? "no receipt" : humanize(status);
}

function units(asset: string | undefined, amount: string | undefined, find: Find): string | null {
  if (!asset || !amount || !/^[0-9]{1,78}$/.test(amount)) return null;
  const known = find(asset);
  return known ? `${formatDisplay(amount, known.decimals)} ${known.symbol}` : null;
}

const spend = (label: string | null) => (label ? `up to ${label}` : null);

/**
 * An amount a withdrawal delivers. On chain near it is the withdrawn token's own units; a bridged
 * withdrawal counts in the destination chain's asset, which the receipt does not name.
 */
function delivered(
  item: Extract<ReceiptItem, { type: "withdraw" }>,
  amount: string | undefined,
  find: Find,
): string | null {
  if (!amount || !/^[0-9]{1,78}$/.test(amount)) return null;
  return canonicalChain(item.details.chain) === "near"
    ? units(item.details.asset, amount, find)
    : `${amount} atomic units, in the destination chain's asset`;
}

/**
 * What moved, in token units; null when the receipt does not say or the token is unknown. An
 * exact-output request names no spent amount, only the most it could spend.
 */
export function receiptAmountLabel(item: ReceiptItem, find: Find): string | null {
  switch (item.type) {
    case "transfer":
      return units(item.details.asset, item.details.amount, find);
    case "withdraw":
      return item.details.max_amount_in === undefined
        ? units(item.details.asset, item.details.amount, find)
        : spend(units(item.details.asset, item.details.max_amount_in, find));
    case "deposit":
      return units(item.details.origin_asset, item.details.deposited_amount, find);
    case "swap": {
      const { origin_asset, destination_asset, amount, max_amount_in, amount_out } = item.details;
      const sent =
        max_amount_in === undefined
          ? units(origin_asset, amount, find)
          : spend(units(origin_asset, max_amount_in, find));
      const got = units(destination_asset, amount_out, find);
      return sent && got ? `${sent} → ${got}` : sent;
    }
    case "limit_order": {
      const sent = units(item.details.origin_asset, item.details.amount, find);
      const got = units(item.details.destination_asset, item.details.amount_out, find);
      return sent && got ? `${sent} → ${got}` : sent;
    }
  }
}

/**
 * The terms a withdrawal or swap receipt commits to beyond its headline amount: what an
 * exact-output request delivers exactly and the most it may spend, or an exact-input request's
 * minimum and the delivery the provider reported.
 */
export function receiptTermRows(item: ReceiptItem, find: Find): [label: string, value: string][] {
  if (item.type !== "withdraw" && item.type !== "swap") return [];
  const { amount_out, min_amount_out, max_amount_in } = item.details;
  const show = (amount: string | undefined) =>
    item.type === "withdraw"
      ? delivered(item, amount, find)
      : units(item.details.destination_asset, amount, find);
  const input = units(
    item.type === "withdraw" ? item.details.asset : item.details.origin_asset,
    max_amount_in,
    find,
  );
  const rows: [string, string | null][] =
    max_amount_in === undefined
      ? [
          ["Minimum received", show(min_amount_out)],
          ["Delivered", show(amount_out)],
        ]
      : [
          ["Receives exactly", show(amount_out)],
          ["Spends at most", input],
        ];
  return rows.filter((row): row is [string, string] => row[1] !== null);
}

export function receiptUsdLabel(item: ReceiptItem): string | null {
  const value = item.details.usd_value;
  return value === undefined ? null : formatUsd(Number(value));
}
