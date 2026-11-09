"use client";

import { useQuery } from "@tanstack/react-query";
import { useMemo, useState } from "react";
import { limitOrderPriceSchema } from "@/lib/agent-api/schemas";
import { parseUnits } from "@/lib/format/amount";
import { queryKeys } from "@/lib/query/keys";
import { fundsApi } from "../api";
import type { BalanceLane } from "../flows/flow-parts";
import { heldTokens, useFunds } from "../funds-context";
import { extractOrderPreview, pick } from "../model/quote";
import { useIdempotencyKey } from "../model/use-idempotency-key";
import { useDebouncedValue, useTracking } from "../model/use-move";
import { type TokenOption, useFundsAction } from "../use-funds";

export type OrderSide = "sell" | "buy";

const DAY_MS = 24 * 60 * 60 * 1000;

/** How long an order may rest. Seven days is the API's default and its limit, so it sends none. */
export const DEADLINES = [
  { id: "1d", label: "1 day", ms: DAY_MS },
  { id: "3d", label: "3 days", ms: 3 * DAY_MS },
  { id: "7d", label: "7 days", ms: null },
] as const;
export type DeadlineId = (typeof DEADLINES)[number]["id"];

export type OrderRequest = {
  base_asset: string;
  quote_asset: string;
  side: OrderSide;
  quantity: string;
  price: string;
  confidential: boolean;
};

/** An order is only quotable once it names two different tokens, an amount and a valid price. */
export function buildOrderRequest(input: {
  base: TokenOption | null;
  quote: TokenOption | null;
  side: OrderSide;
  quantity: bigint | null;
  price: string;
  confidential: boolean;
}): OrderRequest | null {
  const { base, quote, side, quantity, price, confidential } = input;
  if (!base || !quote || !quantity || quantity === 0n) return null;
  if (base.assetId === quote.assetId) return null;
  if (!limitOrderPriceSchema.safeParse(price).success) return null;
  return {
    base_asset: base.assetId,
    quote_asset: quote.assetId,
    side,
    quantity: quantity.toString(),
    price,
    confidential,
  };
}

export function orderReason(input: {
  base: TokenOption | null;
  quote: TokenOption | null;
  quantity: bigint | null;
  price: string;
}): string | null {
  if (!input.base) return "Choose a token to trade";
  if (!input.quote) return "Choose the token the price is in";
  if (input.base.assetId === input.quote.assetId) return "Pick two different tokens";
  if (!input.quantity || input.quantity === 0n) return "Enter an amount";
  if (!limitOrderPriceSchema.safeParse(input.price).success) return "Enter a price";
  return null;
}

/**
 * A fixed deadline per draft: the same inputs keep the same deadline, so a retry under the same
 * idempotency key repeats the same request instead of a new one.
 */
function useDeadline(id: DeadlineId, fingerprint: string): string | undefined {
  // biome-ignore lint/correctness/useExhaustiveDependencies: the draft is the dependency by design
  return useMemo(() => {
    const ms = DEADLINES.find((deadline) => deadline.id === id)?.ms;
    return ms ? new Date(Date.now() + ms).toISOString() : undefined;
  }, [id, fingerprint]);
}

/**
 * The limit-order draft and its dry run. Rules and balance never refuse a preview, so every one
 * the live order would fail comes back as a warning beside the order's own terms.
 */
export function usePlaceOrder() {
  const funds = useFunds();
  const [side, setSide] = useState<OrderSide>("sell");
  const [lane, setLane] = useState<BalanceLane>("public");
  const [pickedBase, setBase] = useState<TokenOption | null>(null);
  const [quote, setQuote] = useState<TokenOption | null>(null);
  const [amount, setAmount] = useState("");
  const [price, setPriceText] = useState("");
  const [deadlineId, setDeadlineId] = useState<DeadlineId>("7d");
  const { tracking, track } = useTracking();

  const confidential = lane === "private";
  const holdings = confidential ? funds.privateHoldings : funds.holdings;
  const base = pickedBase ?? heldTokens(holdings)[0] ?? null;
  const quantity = base ? parseUnits(amount, base.decimals) : null;
  const request = buildOrderRequest({ base, quote, side, quantity, price, confidential });
  const fingerprint = JSON.stringify(request);
  // The request is rebuilt every render; debouncing its text keeps the timer from restarting.
  const debounced = useDebouncedValue(fingerprint);
  const preview = useQuery({
    queryKey: queryKeys.limitOrderQuote(funds.agent.id, debounced),
    queryFn: async () =>
      extractOrderPreview(
        (await fundsApi.funds(funds.agent.id, "limit_order_quote", JSON.parse(debounced))).result,
      ),
    enabled: Boolean(funds.access) && debounced !== "null",
    retry: false,
    staleTime: 20_000,
  });
  const key = useIdempotencyKey(fingerprint);
  const deadline = useDeadline(deadlineId, fingerprint);
  const action = useFundsAction(funds.agent.id);
  const reason = orderReason({ base, quote, quantity, price });
  const title = `${side === "sell" ? "Sell" : "Buy"} ${base?.symbol ?? ""} for ${quote?.symbol ?? ""}`;
  const waitingOnPreview =
    request !== null &&
    !preview.error &&
    (debounced !== fingerprint || !pick(preview.data?.quote ?? null, ["spend_amount"]));

  const execute = () => {
    if (!request) return;
    action.mutate(
      { tool: "place_limit_order", args: { ...request, deadline, idempotencyKey: key } },
      { onSuccess: (result) => track({ ...result, title }) },
    );
  };

  return {
    funds,
    side,
    setSide,
    lane,
    setLane,
    holdings,
    base,
    setBase,
    quote,
    setQuote,
    amount,
    setAmount,
    price,
    // Commas are thousands separators in an amount and never part of an exact decimal price.
    setPrice: (value: string) => setPriceText(value.replaceAll(",", "")),
    deadlineId,
    setDeadlineId,
    request,
    preview,
    waitingOnPreview,
    reason,
    action,
    execute,
    title,
    tracking,
  };
}
