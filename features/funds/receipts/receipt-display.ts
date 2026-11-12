import type { ReceiptItem } from "@near-intents-agent-api/sdk";
import { formatUsd } from "@/features/assets";
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

/** What moved, in token units; null when the receipt does not say or the token is unknown. */
export function receiptAmountLabel(item: ReceiptItem, find: Find): string | null {
  switch (item.type) {
    case "transfer":
    case "withdraw":
      return units(item.details.asset, item.details.amount, find);
    case "deposit":
      return units(item.details.origin_asset, item.details.deposited_amount, find);
    case "swap":
    case "limit_order": {
      const sent = units(item.details.origin_asset, item.details.amount, find);
      const got = units(item.details.destination_asset, item.details.amount_out, find);
      return sent && got ? `${sent} → ${got}` : sent;
    }
  }
}

export function receiptUsdLabel(item: ReceiptItem): string | null {
  const value = item.details.usd_value;
  return value === undefined ? null : formatUsd(Number(value));
}
