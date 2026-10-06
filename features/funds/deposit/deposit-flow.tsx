"use client";

import { BalanceContext } from "../flows/balance-context";
import { DepositSourceDropdown } from "./deposit-source-dropdown";
import { IntentsDeposit } from "./intents-deposit";
import { NetworkDeposit } from "./network-deposit";
import type { useDepositFlow } from "./use-deposit-flow";

/**
 * Funding the agent. Everything the agent does happens inside NEAR Intents, so funds must land
 * there: either from another network through a one-time 1Click deposit address, or by a
 * transfer from any other NEAR Intents account. The agent's own chain addresses are never
 * offered — funds sent there would sit outside NEAR Intents, out of the agent's reach.
 */
export function DepositFlow({ view }: { view: ReturnType<typeof useDepositFlow> }) {
  const { source, form } = view;
  return (
    <div className="flex flex-col gap-5">
      <BalanceContext label="Deposit into" lane={source === "network" ? form.lane : "public"} />
      <DepositSourceDropdown
        value={source}
        onChange={view.pickSource}
        disabled={form.action.isPending}
        open={view.sourceOpen}
        onOpenChange={view.setSourceOpen}
      />
      {source === "network" ? <NetworkDeposit view={view} /> : <IntentsDeposit />}
    </div>
  );
}
