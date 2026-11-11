"use client";
import { useState } from "react";
import {
  intentsAccount,
  isNearcomAddress,
  transferRecipientProblem,
} from "@/lib/agent-api/address";
import { useFunds } from "../funds-context";
import { useIdempotencyKey } from "../model/use-idempotency-key";
import { amountReason, useSourceAmount, useTracking } from "../model/use-move";
import { useReceiptLabels } from "../model/use-receipt-labels";
import { useFundsAction } from "../use-funds";
import { transferRecipient } from "./transfer-recipient-utils";

export function useSendFlow() {
  const funds = useFunds();
  const source = useSourceAmount(funds.holdings);
  const [selectedRecipient, setRecipient] = useState<string | null>(null);
  const picked = transferRecipient(funds.rules?.destinations, selectedRecipient);
  const { open, destinations } = picked;
  const recipient = picked.recipient && intentsAccount(picked.recipient);
  const nearcom = Boolean(selectedRecipient && isNearcomAddress(selectedRecipient));
  const { tracking, track, clear } = useTracking();
  const action = useFundsAction(funds.agent.id);
  const labels = useReceiptLabels();
  const { token, atomic } = source;
  const key = useIdempotencyKey(
    `${token?.assetId}|${atomic}|${recipient}|${JSON.stringify(labels.args)}`,
  );

  const reason =
    amountReason({ ...source, empty: "Add funds to transfer" }) ??
    (recipient ? (open ? transferRecipientProblem(recipient) : null) : "Choose who receives it") ??
    labels.problem;

  const send = () => {
    if (!token || !atomic || !recipient) return;
    action.mutate(
      {
        tool: "confidential_transfer",
        args: {
          token: token.assetId,
          amount: atomic.toString(),
          to: recipient,
          ...labels.args,
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
    labels.reset();
    action.reset();
  };
  return {
    resetDraft,
    hasDestination: Boolean(selectedRecipient),
    funds,
    labels,
    source,
    setRecipient,
    destinations,
    open,
    displayRecipient: open ? selectedRecipient : recipient ? selectedRecipient : null,
    recipient,
    nearcom,
    tracking,
    clear,
    action,
    reason,
    send,
  };
}
