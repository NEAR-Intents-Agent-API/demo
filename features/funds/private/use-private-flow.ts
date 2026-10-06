"use client";
import { useState } from "react";
import { useFunds } from "../funds-context";
import { useIdempotencyKey } from "../model/use-idempotency-key";
import { amountReason, useSourceAmount, useTracking } from "../model/use-move";
import { useFundsAction } from "../use-funds";
import { COPY, type Direction } from "./private-utils";

export function usePrivateFlow() {
  const funds = useFunds();
  const [direction, setDirection] = useState<Direction>("shield");
  const lane = direction === "shield" ? funds.holdings : funds.privateHoldings;
  const source = useSourceAmount(lane);
  const { tracking, track, clear } = useTracking();
  const action = useFundsAction(funds.agent.id);
  const { token, atomic } = source;
  const key = useIdempotencyKey(`${direction}|${token?.assetId}|${atomic}`);
  const copy = COPY[direction];

  const reason = amountReason({ ...source, empty: copy.empty });
  const move = () => {
    if (!token || !atomic) return;
    action.mutate(
      {
        tool: direction,
        args: { token: token.assetId, amount: atomic.toString(), idempotencyKey: key },
      },
      { onSuccess: track },
    );
  };

  const resetDraft = () => {
    clear();
    source.setPicked(null);
    source.setAmount("");

    action.reset();
  };
  return {
    resetDraft,
    direction,
    setDirection,
    source,
    tracking,
    clear,
    action,
    copy,
    reason,
    move,
  };
}
