"use client";

import { useState } from "react";
import { type CatalogOption, chainInfo } from "@/features/assets";
import { tokenAllowed } from "@/features/policy/model";
import { parseUnits } from "@/lib/format/amount";
import { useFunds } from "../funds-context";
import { useIdempotencyKey } from "../model/use-idempotency-key";
import { useFundsAction } from "../use-funds";
import { depositArgs, depositReason } from "./deposit-utils";

export type DepositTracking = { id: string; title: string; token: CatalogOption };

export function useDepositForm(onCreated: (ticket: DepositTracking) => void) {
  const funds = useFunds();
  const action = useFundsAction(funds.agent.id);
  const [chain, setChain] = useState<string>("near");
  const [picked, setPicked] = useState<string | null>(null);
  const [amount, setAmount] = useState("");

  const tokens = funds.catalog.tokens.filter(
    (token) => token.chain === chain && tokenAllowed(funds.rules, token.assetId),
  );
  const token = tokens.find((item) => item.assetId === picked) ?? tokens[0] ?? null;
  const atomic = token ? parseUnits(amount, token.decimals) : null;
  const key = useIdempotencyKey(`${token?.assetId}|${atomic}`);

  const reason = depositReason(token, amount, atomic);

  const create = () => {
    if (!token || reason) return;
    action.mutate(
      {
        tool: "create_cross_chain_deposit",
        args: depositArgs({ token, atomic, key }),
      },
      {
        onSuccess: (result) =>
          result.operationId &&
          onCreated({
            id: result.operationId,
            title: `${atomic ? `${amount} ` : ""}${token.symbol} on ${chainInfo(chain).name}`,
            token,
          }),
      },
    );
  };

  const changeChain = (next: string) => {
    setChain(next);
    setPicked(null);
  };
  const reset = () => {
    setChain("near");
    setPicked(null);
    setAmount("");
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
    tokens,
    token,
    atomic,
    reason,
    create,
  };
}
