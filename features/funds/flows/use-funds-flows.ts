"use client";
import { useEffect } from "react";
import { useDepositFlow } from "../deposit/use-deposit-flow";
import { useSendFlow } from "../send/use-send-flow";
import { useShieldFlow } from "../shield/use-shield-flow";
import { useSwapFlow } from "../swap/use-swap-flow";
import { useWithdrawFlow } from "../withdraw/use-withdraw-flow";
import type { FlowId } from "./flow-options";
import {
  applyFlowBalance,
  portfolioLaneOf,
  shouldInitializeLane,
  withdrawLane,
} from "./flow-state-utils";

type Lane = "public" | "confidential";

/**
 * Controllers keep drafts and accepted operations across action and signing transitions. Every
 * flow runs on the confidential balance except two that exist for the legacy public one:
 * Shield always starts there, and Withdraw follows the balance the portfolio shows.
 */
export function useFundsFlows(
  lane: Lane,
  flow: FlowId,
  onFlow: (flow: FlowId | null) => void,
  onLane: (lane: Lane) => void,
) {
  const deposit = useDepositFlow();
  const swap = useSwapFlow();
  const send = useSendFlow();
  const withdraw = useWithdrawFlow();
  const shield = useShieldFlow();
  const views = { deposit, swap, send, withdraw, shield };
  const withdrawDrafted =
    withdraw.source.hasDraft || withdraw.chain !== null || withdraw.recipient !== null;
  const busy = flow === "deposit" ? deposit.form.action.isPending : views[flow].action.isPending;
  const followWithdrawBalance = (selected: Lane) =>
    applyFlowBalance({
      lane: withdrawLane(selected),
      currentLane: withdraw.lane,
      pending: withdraw.action.isPending,
      tracking: withdraw.tracking,
      setLane: withdraw.setLane,
      clearAmount: () => withdraw.source.setAmount(""),
    });
  const changeLane = (next: Lane) => {
    if (busy) return;
    followWithdrawBalance(next);
    onLane(next);
  };
  const openFlow = (next: FlowId) => {
    if (busy) return;
    if (next === "withdraw") {
      const fresh = shouldInitializeLane(
        withdraw.source.amount,
        withdraw.tracking,
        withdrawDrafted,
      );
      if (fresh) followWithdrawBalance(lane);
      onLane(fresh ? lane : portfolioLaneOf(withdraw.lane));
    } else {
      onLane(next === "shield" ? "public" : "confidential");
    }
    onFlow(next);
  };
  // The portfolio can change the balance while Withdraw is open; the same guard applies.
  useEffect(() => {
    if (flow === "withdraw") followWithdrawBalance(lane);
  });
  return { views, openFlow, changeLane, busy };
}

export type FundsViews = ReturnType<typeof useFundsFlows>["views"];
