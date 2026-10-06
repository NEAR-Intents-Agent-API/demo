"use client";

import { useAccess, useHoldings } from "@/features/funds/index";
import { useMcpAgent } from "@/features/mcp/data";
import { walletSetupSteps } from "./wallet-setup-steps";

export function useWalletSetup(
  agentId: string,
  actions: { activated?: () => void; deposit: () => void; access: () => void; connect: () => void },
) {
  const publicLane = useHoldings(agentId, "public");
  const privateLane = useHoldings(agentId, "confidential");
  const access = useAccess(agentId);
  const clients = useMcpAgent(agentId);
  const error = publicLane.query.error ?? privateLane.query.error ?? access.error ?? clients.error;
  const settled = !(
    publicLane.query.isPending ||
    privateLane.query.isPending ||
    access.isPending ||
    clients.isPending
  );
  const steps = walletSetupSteps({
    funded: [...publicLane.holdings, ...privateLane.holdings].some((holding) => holding.raw > 0n),
    hasAccess: Boolean(access.data),
    hasClient: (clients.data?.clients ?? []).some((client) => client.status === "authorized"),
    onDeposit: actions.deposit,
    onEnableAccess: actions.access,
    onConnect: actions.connect,
    onActivated: actions.activated,
  });
  const refresh = () =>
    Promise.all([
      publicLane.query.refetch(),
      privateLane.query.refetch(),
      access.refetch(),
      clients.refetch(),
    ]);
  return { publicLane, privateLane, access, clients, settled, steps, error, refresh };
}
