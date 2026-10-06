"use client";

import type { Destination } from "@near-intents-agent-api/sdk";
import { useQuery } from "@tanstack/react-query";
import { useEffect, useMemo, useState } from "react";
import { canonicalChain } from "@/lib/agent-api/schemas";
import { queryKeys } from "@/lib/query/keys";
import { destinationName } from "../access/destination-utils";
import { fundsApi } from "../api";
import type { BalanceLane } from "../flows/flow-parts";
import { useFunds } from "../funds-context";
import { extractQuote } from "../model/quote";
import { useIdempotencyKey } from "../model/use-idempotency-key";
import { amountReason, useSourceAmount, useTracking } from "../model/use-move";
import { type TokenOption, useFundsAction } from "../use-funds";

export type WithdrawArgs = {
  token: string;
  amount: string;
  chain: string;
  to: string;
  confidential: boolean;
  memo?: string;
};

/** Fee preview for the exact withdrawal on screen; it only runs once every field is valid. */
function useWithdrawPreview(agentId: string, args: WithdrawArgs | null, enabled: boolean) {
  return useQuery({
    queryKey: queryKeys.withdrawPreview(agentId, args),
    queryFn: async () =>
      extractQuote(
        (
          await fundsApi.funds(
            agentId,
            "withdraw_preview",
            args as unknown as Record<string, unknown>,
          )
        ).result,
      ),
    enabled: enabled && args !== null,
    retry: false,
    staleTime: 20_000,
  });
}

/** A destination approved for one kind of address makes no sense on another chain family. */
type WithdrawDestination = Extract<Destination, { action: "withdraw" }>;

function suitableDestinations(
  all: readonly Destination[],
  network: string | null,
): WithdrawDestination[] {
  return all.filter(
    (destination): destination is WithdrawDestination =>
      destination.action === "withdraw" && destination.chain === canonicalChain(network ?? ""),
  );
}

function buildWithdrawArgs(input: {
  token: TokenOption | null;
  network: string | null;
  atomic: bigint | null;
  over: boolean;
  recipient: string | null;
  confidential: boolean;
  memo?: string;
}): WithdrawArgs | null {
  const { token, network, atomic, over, recipient, confidential } = input;
  if (!token || !network || !atomic || atomic === 0n || over || !recipient) return null;
  return {
    token: token.assetId,
    amount: atomic.toString(),
    chain: network,
    to: recipient,
    confidential,
    ...(input.memo === undefined ? {} : { memo: input.memo }),
  };
}

function withdrawReason(
  source: ReturnType<typeof useSourceAmount>,
  network: string | null,
  recipient: string | null,
): string | null {
  const amount = amountReason({ ...source, empty: "Add funds to withdraw" });
  if (amount) return amount;
  if (!network) return "No allowed network for this token";
  return recipient ? null : "Choose a destination";
}

/**
 * Every fact and draft the withdrawal form needs: which balance pays, which network it settles
 * to, which approved destination receives it, and the live fee preview for exactly those inputs.
 */
export function useWithdrawFlow(initialLane: BalanceLane = "public") {
  const funds = useFunds();
  const [lane, setLane] = useState<BalanceLane>(initialLane);
  const source = useSourceAmount(lane === "private" ? funds.privateHoldings : funds.holdings);
  const [chain, setChain] = useState<string | null>(null);
  const [recipient, setRecipient] = useState<string | null>(null);
  const { tracking, track, clear } = useTracking();

  const { token, atomic } = source;
  // Destinations restrict where funds may go; every network the token reaches is open to withdraw.
  const networks = token?.chains ?? [];
  const network = chain && networks.includes(chain) ? chain : (networks[0] ?? null);
  const rule = funds.rules?.destinations;
  // "Anywhere" and "Except these" take a typed address; the API refuses a blocked one.
  const open = rule !== undefined && rule.mode !== "only";
  const suitable = useMemo(
    () => (rule?.mode === "only" ? suitableDestinations(rule.list, network) : []),
    [rule, network],
  );
  useEffect(() => {
    if (!open && recipient && !suitable.some((item) => destinationName(item) === recipient))
      setRecipient(null);
  }, [open, suitable, recipient]);

  const selected = suitable.find((item) => destinationName(item) === recipient);
  const args = buildWithdrawArgs({
    token,
    network,
    atomic,
    over: source.over,
    recipient: open ? recipient || null : (selected?.address ?? null),
    ...(selected?.memo != null ? { memo: selected.memo } : {}),
    confidential: lane === "private",
  });
  const preview = useWithdrawPreview(funds.agent.id, args, Boolean(funds.access));
  const key = useIdempotencyKey(JSON.stringify(args));
  const reason = withdrawReason(source, network, recipient);

  const action = useFundsAction(funds.agent.id);
  const submit = () => {
    if (!args) return;
    action.mutate(
      { tool: "withdraw", args: { ...args, async: true, idempotencyKey: key } },
      { onSuccess: track },
    );
  };

  const resetDraft = () => {
    clear();
    source.setPicked(null);
    source.setAmount("");
    setChain(null);
    setRecipient(null);
    action.reset();
  };
  return {
    resetDraft,
    action,
    submit,
    funds,
    source,
    lane,
    setLane,
    chain,
    setChain,
    recipient,
    setRecipient,
    networks,
    network,
    open,
    suitable,
    args,
    preview,
    key,
    reason,
    tracking,
    track,
    clear,
  };
}
