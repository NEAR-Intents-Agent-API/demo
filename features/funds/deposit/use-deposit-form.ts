"use client";

import { useState } from "react";
import { chainInfo, REFUND_ADDRESS_CHAINS } from "@/features/assets";
import { tokenAllowed } from "@/features/policy/model";
import { parseUnits } from "@/lib/format/amount";
import type { BalanceLane } from "../flows/flow-parts";
import { useFunds } from "../funds-context";
import { useIdempotencyKey } from "../model/use-idempotency-key";
import { useFundsAction } from "../use-funds";
import { depositArgs, depositReason } from "./deposit-utils";

export function useDepositForm(onCreated: (ticket: { id: string; title: string }) => void) {
  const funds = useFunds();
  const action = useFundsAction(funds.agent.id);
  const [chain, setChain] = useState<string>("near");
  const [picked, setPicked] = useState<string | null>(null);
  const [amount, setAmount] = useState("");
  const [lane, setLane] = useState<BalanceLane>("public");
  const [refund, setRefund] = useState("");

  const tokens = funds.catalog.tokens.filter(
    (token) => token.chain === chain && tokenAllowed(funds.rules, token.assetId),
  );
  const token = tokens.find((item) => item.assetId === picked) ?? tokens[0] ?? null;
  const atomic = token ? parseUnits(amount, token.decimals) : null;
  const needsRefund = REFUND_ADDRESS_CHAINS.has(chain);
  const privateOn = funds.rules?.abilities.confidential !== false;
  const confidential = lane === "private";
  const key = useIdempotencyKey(`${token?.assetId}|${atomic}|${confidential}|${refund}`);

  const reason =
    !privateOn && confidential
      ? "Private deposits are off in this account's rules"
      : depositReason(token, atomic, needsRefund && !refund.trim());

  const create = () => {
    if (!token || !atomic || reason) return;
    action.mutate(
      {
        tool: "create_cross_chain_deposit",
        args: depositArgs({
          token,
          atomic,
          confidential,
          refund: needsRefund ? refund : null,
          key,
        }),
      },
      {
        onSuccess: (result) =>
          result.operationId &&
          onCreated({
            id: result.operationId,
            title: `${amount} ${token.symbol} on ${chainInfo(chain).name}`,
          }),
      },
    );
  };

  const changeChain = (next: string) => {
    setChain(next);
    setPicked(null);
    setRefund("");
  };
  const reset = () => {
    setChain("near");
    setPicked(null);
    setAmount("");
    setLane("public");
    setRefund("");
    action.reset();
  };
  return {
    reset,
    action,
    chain,
    changeChain,
    setPicked,
    amount,
    setAmount,
    lane,
    setLane,
    refund,
    setRefund,
    tokens,
    token,
    atomic,
    needsRefund,
    reason,
    create,
  };
}
