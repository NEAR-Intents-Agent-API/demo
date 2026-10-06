"use client";
import { useEffect } from "react";
import { useDepositFlow } from "../deposit/use-deposit-flow";
import { usePrivateFlow } from "../private/use-private-flow";
import { useSendFlow } from "../send/use-send-flow";
import { useSwapFlow } from "../swap/use-swap-flow";
import { useWithdrawFlow } from "../withdraw/use-withdraw-flow";
import type { FlowId } from "./flow-options";
import {
  applyFlowBalance,
  initialFlowLane,
  portfolioLaneOf,
  shouldInitializeLane,
} from "./flow-state-utils";

/** Controllers keep drafts and accepted operations across action and signing transitions. */
export function useFundsFlows(
  lane: "public" | "confidential",
  flow: FlowId,
  onFlow: (flow: FlowId | null) => void,
  onLane: (lane: "public" | "confidential") => void,
) {
  const deposit = useDepositFlow();
  const swap = useSwapFlow();
  const send = useSendFlow();
  const withdraw = useWithdrawFlow();
  const privateFlow = usePrivateFlow();
  const views = { deposit, swap, send, withdraw, private: privateFlow };
  const draftSelections = {
    swap: swap.source.hasDraft || swap.to !== null,
    send: send.source.hasDraft || send.hasDestination,
    withdraw: withdraw.source.hasDraft || withdraw.chain !== null || withdraw.recipient !== null,
  };
  const busy = flow === "deposit" ? deposit.form.action.isPending : views[flow].action.isPending;
  const setFlowBalance = (id: FlowId, selectedLane: "public" | "confidential") => {
    if (id === "private") return;
    const target = id === "deposit" ? deposit.form : views[id];
    applyFlowBalance({
      lane: initialFlowLane(
        id,
        selectedLane,
        id === "deposit" || views[id].funds.rules?.abilities.confidential !== false,
      ),
      currentLane: target.lane,
      pending: target.action.isPending,
      tracking: id === "deposit" ? deposit.tracking : views[id].tracking,
      setLane: target.setLane,
      ...(id === "deposit" ? {} : { clearAmount: () => views[id].source.setAmount("") }),
      ...(id === "send" ? { clearRecipient: () => send.setRecipient(null) } : {}),
    });
  };
  const changeLane = (next: "public" | "confidential") => {
    if (busy) return;
    setFlowBalance(flow, next);
    onLane(next);
  };
  const restoreSpendingLane = (
    next: "swap" | "send" | "withdraw",
    selectedLane: "public" | "confidential",
  ) => {
    const view = views[next];
    const fresh = shouldInitializeLane(view.source.amount, view.tracking, draftSelections[next]);
    if (fresh) setFlowBalance(next, selectedLane);
    const selected = fresh
      ? initialFlowLane(next, selectedLane, view.funds.rules?.abilities.confidential !== false)
      : view.lane;
    onLane(portfolioLaneOf(selected));
  };
  const openFlow = (next: FlowId, selectedLane = lane) => {
    if (busy) return;
    if (next === "deposit") {
      setFlowBalance(next, selectedLane);
      onLane(deposit.tracking ? portfolioLaneOf(deposit.form.lane) : selectedLane);
    } else if (next !== "private") {
      restoreSpendingLane(next, selectedLane);
    }
    onFlow(next);
  };
  // Setup actions can select Deposit from outside this workspace; synchronize through the same guard.
  useEffect(() => {
    setFlowBalance(flow, lane);
  });
  return { views, openFlow, changeLane, busy };
}

export type FundsViews = ReturnType<typeof useFundsFlows>["views"];
