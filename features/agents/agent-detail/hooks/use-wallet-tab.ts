"use client";

import type { AgentView } from "@near-intents-agent-api/sdk";
import { useQueryClient } from "@tanstack/react-query";
import { useMemo, useState } from "react";
import { useCatalog } from "@/features/assets";
import {
  balanceLookup,
  type FlowId,
  type Lane,
  useAccess,
  useAccessFlow,
  useHoldings,
} from "@/features/funds/index";
import { usePolicyView } from "@/features/policy/data";
import { rulesFromPolicy, tokenAllowed } from "@/features/policy/model";
import { refreshAgentQueries } from "@/lib/query/refresh-agent";

/**
 * Shared account reads and wallet drafts: one place that knows the balances,
 * the rules, the dashboard grant and the connected clients, so the setup strip, the portfolio and
 * every flow cannot disagree about what is true.
 */
export function useWalletTab(
  agent: AgentView,
  open: { activity: () => void; rules: () => void; connect: () => void },
) {
  const cache = useQueryClient();
  const [lane, setLane] = useState<Lane>("public");
  const [flow, setFlow] = useState<FlowId | null>("deposit");
  const [refreshing, setRefreshing] = useState(false);

  const accessFlow = useAccessFlow(agent);
  const publicLane = useHoldings(agent.id, "public");
  const privateLane = useHoldings(agent.id, "confidential");
  const access = useAccess(agent.id);
  const catalog = useCatalog();
  const policy = usePolicyView(agent.id);
  const rules = useMemo(
    () => (policy.data?.policy ? rulesFromPolicy(policy.data.policy) : null),
    [policy.data],
  );

  const active = lane === "public" ? publicLane : privateLane;
  // Flows only offer what the rules let the account spend; the holdings list shows everything.
  const spendable = useMemo(
    () => publicLane.holdings.filter((holding) => tokenAllowed(rules, holding.assetId)),
    [publicLane.holdings, rules],
  );
  const privateSpendable = useMemo(
    () => privateLane.holdings.filter((holding) => tokenAllowed(rules, holding.assetId)),
    [privateLane.holdings, rules],
  );
  const allowedTokens = useMemo(
    () => catalog.tokens.filter((token) => tokenAllowed(rules, token.assetId)),
    [catalog.tokens, rules],
  );

  const publicBalances = useMemo(() => balanceLookup(publicLane.holdings), [publicLane.holdings]);
  const privateBalances = useMemo(
    () => balanceLookup(privateLane.holdings),
    [privateLane.holdings],
  );

  const refresh = async () => {
    if (refreshing) return;
    setRefreshing(true);
    try {
      await refreshAgentQueries(cache, agent.id);
    } finally {
      setRefreshing(false);
    }
  };

  // One stable context value: every flow re-renders when a fact changes, but not on an
  // unrelated render of the wallet screen.
  const funds = useMemo(
    () => ({
      agent,
      tokens: allowedTokens,
      chains: catalog.chains,
      holdings: spendable,
      privateHoldings: privateSpendable,
      publicBalances,
      privateBalances,
      access: access.data ?? null,
      enableAccess: accessFlow.openForm,
      manageDestinations: accessFlow.manageDestinations,
      openActivity: open.activity,
      openRules: open.rules,
      rules,
      catalog,
    }),
    [
      access.data,
      accessFlow.openForm,
      accessFlow.manageDestinations,
      agent,
      allowedTokens,
      catalog,
      open.activity,
      open.rules,
      privateBalances,
      privateSpendable,
      publicBalances,
      rules,
      spendable,
    ],
  );

  return {
    lane,
    setLane,
    flow,
    setFlow,
    active,
    funds,
    catalog,
    access,
    accessFlow,
    refresh,
    refreshing,
    funded: [...publicLane.holdings, ...privateLane.holdings].some((holding) => holding.raw > 0n),
  };
}
