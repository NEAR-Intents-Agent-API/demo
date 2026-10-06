"use client";

import type { AgentView } from "@near-intents-agent-api/sdk";
import { createContext, useContext } from "react";
import type { BalanceLookup, Catalog } from "@/features/assets";
import type { Rules } from "@/features/policy/model";
import type { DestinationContext } from "./access/destination-utils";
import type { Holding, TokenOption, useAccess } from "./use-funds";

/**
 * Everything a money-moving flow needs to know about the wallet it acts on, resolved once by the
 * wallet screen. Flows read from here instead of each running their own queries, so the balance
 * you see in the picker is the balance the amount field checks.
 */
export type FundsContextValue = {
  agent: AgentView;
  tokens: readonly TokenOption[];
  chains: readonly string[];
  holdings: readonly Holding[];
  /** Private-balance holdings; empty until the Private lane asks for them. */
  privateHoldings: readonly Holding[];
  publicBalances: BalanceLookup;
  privateBalances: BalanceLookup;
  access: NonNullable<ReturnType<typeof useAccess>["data"]> | null;
  enableAccess: () => void;
  manageDestinations: (initial?: DestinationContext) => void;
  openActivity: () => void;
  openRules: () => void;
  /** The rules in force; null while they load or when none are installed. */
  rules: Rules | null;
  catalog: Catalog;
};

const FundsContext = createContext<FundsContextValue | null>(null);
export const FundsProvider = FundsContext.Provider;

export function useFunds(): FundsContextValue {
  const value = useContext(FundsContext);
  if (!value) throw new Error("useFunds outside a wallet screen");
  return value;
}

export function balanceLookup(holdings: readonly Holding[]): BalanceLookup {
  return new Map(holdings.map((h) => [h.assetId, { raw: h.raw, decimals: h.decimals }]));
}

/** Tokens the wallet holds, resolved to the token list so a picker can show their art and chain. */
export function heldTokens(holdings: readonly Holding[]): TokenOption[] {
  return holdings
    .filter((holding) => holding.raw > 0n && holding.token)
    .map((holding) => holding.token as TokenOption);
}
