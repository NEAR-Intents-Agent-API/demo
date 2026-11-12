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
import { extractWithdrawPreview } from "../model/quote";
import { useIdempotencyKey } from "../model/use-idempotency-key";
import { amountReason, useSourceAmount, useTracking } from "../model/use-move";
import { useReceiptLabels } from "../model/use-receipt-labels";
import { type TokenOption, useFundsAction } from "../use-funds";

export type WithdrawArgs = {
  token: string;
  amount: string;
  chain: string;
  to: string;
  /** Only ever `false`: the legacy public balance is the one thing a withdrawal can still name. */
  confidential?: false;
  memo?: string;
};

/**
 * Preview for the exact withdrawal on screen; it only runs once every field is valid. It keeps
 * the API's top-level `fee` next to the provider quote: the quote alone does not value the fee.
 */
function useWithdrawPreview(agentId: string, args: WithdrawArgs | null, enabled: boolean) {
  return useQuery({
    queryKey: queryKeys.withdrawPreview(agentId, args),
    queryFn: async () =>
      extractWithdrawPreview(
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
  legacyPublic: boolean;
  memo?: string;
}): WithdrawArgs | null {
  const { token, network, atomic, over, recipient, legacyPublic } = input;
  if (!token || !network || !atomic || atomic === 0n || over || !recipient) return null;
  return {
    token: token.assetId,
    amount: atomic.toString(),
    chain: network,
    to: recipient,
    ...(legacyPublic ? { confidential: false as const } : {}),
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
export function useWithdrawFlow() {
  const funds = useFunds();
  const [lane, setLane] = useState<BalanceLane>("private");
  const source = useSourceAmount(lane === "private" ? funds.holdings : funds.publicHoldings);
  const [chain, setChain] = useState<string | null>(null);
  const [recipient, setRecipient] = useState<string | null>(null);
  const { tracking, track, clear } = useTracking();
  const labels = useReceiptLabels();

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
    legacyPublic: lane === "public",
  });
  const preview = useWithdrawPreview(funds.agent.id, args, Boolean(funds.access));
  const key = useIdempotencyKey(JSON.stringify([args, labels.args]));
  const reason = withdrawReason(source, network, recipient) ?? labels.problem;

  const action = useFundsAction(funds.agent.id);
  const submit = () => {
    if (!args) return;
    action.mutate(
      { tool: "withdraw", args: { ...args, ...labels.args, async: true, idempotencyKey: key } },
      { onSuccess: track },
    );
  };

  const resetDraft = () => {
    clear();
    source.setPicked(null);
    source.setAmount("");
    setChain(null);
    setRecipient(null);
    labels.reset();
    action.reset();
  };
  return {
    resetDraft,
    action,
    submit,
    funds,
    labels,
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
