"use client";

import { useFunds } from "../funds-context";
import { DepositForm } from "./deposit-form";
import { DepositTicket } from "./deposit-ticket";
import type { useDepositFlow } from "./use-deposit-flow";

export function NetworkDeposit({ view }: { view: ReturnType<typeof useDepositFlow> }) {
  const funds = useFunds();
  const { tracking, finish, form } = view;
  if (tracking)
    return (
      <DepositTicket
        agentId={funds.agent.id}
        operationId={tracking.id}
        title={tracking.title}
        token={tracking.token}
        onDone={finish}
        onOpenActivity={funds.openActivity}
      />
    );
  return <DepositForm form={form} />;
}
