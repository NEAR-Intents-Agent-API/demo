"use client";
import { useState } from "react";
import type { DestinationAction } from "../access/destination-utils";
import type { BalanceLane } from "../flows/flow-parts";
import { useFunds } from "../funds-context";
import { useIdempotencyKey } from "../model/use-idempotency-key";
import { amountReason, useSourceAmount, useTracking } from "../model/use-move";
import { useFundsAction } from "../use-funds";
import { transferRecipient } from "./transfer-recipient-utils";

export function useSendFlow(initialLane: BalanceLane = "public") {
  const funds = useFunds();
  const [lane, setLane] = useState<BalanceLane>(initialLane);
  const confidential = lane === "private";
  const source = useSourceAmount(confidential ? funds.privateHoldings : funds.holdings);
  const [selectedRecipient, setRecipient] = useState<string | null>(null);
  const transferAction: DestinationAction = confidential
    ? "confidential_transfer"
    : "intents_transfer";
  const { open, destinations, recipient } = transferRecipient(
    funds.rules?.destinations,
    transferAction,
    selectedRecipient,
  );
  const { tracking, track, clear } = useTracking();
  const action = useFundsAction(funds.agent.id);
  const { token, atomic } = source;
  const key = useIdempotencyKey(`${token?.assetId}|${atomic}|${recipient}|${confidential}`);

  const reason =
    amountReason({ ...source, empty: "Add funds to transfer" }) ??
    (recipient ? null : "Choose who receives it");

  const send = () => {
    if (!token || !atomic || !recipient) return;
    action.mutate(
      {
        tool: confidential ? "confidential_transfer" : "intents_transfer",
        args: {
          token: token.assetId,
          amount: atomic.toString(),
          to: recipient,
          idempotencyKey: key,
        },
      },
      { onSuccess: track },
    );
  };

  const resetDraft = () => {
    clear();
    source.setPicked(null);
    source.setAmount("");
    setRecipient(null);
    action.reset();
  };
  return {
    resetDraft,
    hasDestination: Boolean(selectedRecipient),
    funds,
    lane,
    setLane,
    source,
    setRecipient,
    destinations,
    open,
    transferAction,
    displayRecipient: open ? selectedRecipient : recipient ? selectedRecipient : null,
    recipient,
    tracking,
    clear,
    action,
    confidential,
    reason,
    send,
  };
}
