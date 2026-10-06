"use client";

import type { AgentView } from "@near-intents-agent-api/sdk";
import Link from "next/link";
import { Panel } from "@/components/shared/page";
import { buttonVariants } from "@/components/ui/button";
import type { AgentState } from "../../model/agent-state";
import { PendingAccountNotice } from "./pending-account-notice";

/** Pending activation stays a notice; its signature flow opens in a separate dialog. */
export function AgentNextStep({ agent, state }: { agent: AgentView; state: AgentState }) {
  if (state.stage === "archived") return null;

  if (state.stage === "abandoned") {
    return (
      <Panel
        className="max-w-3xl"
        title="Activation expired"
        description="This activation expired or failed before the account went live. Create a new account to start again."
      >
        <Link href="/agents/new" className={buttonVariants()}>
          New account
        </Link>
      </Panel>
    );
  }

  if (state.next.id === "onboard") {
    return <PendingAccountNotice agentId={agent.id} />;
  }

  return null;
}
