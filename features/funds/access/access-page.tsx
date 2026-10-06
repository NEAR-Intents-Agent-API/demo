"use client";

import type { AgentView } from "@near-intents-agent-api/sdk";
import { SetupFlowPanel } from "@/components/shared/setup-flow-panel";
import { Loading, Unavailable } from "@/components/shared/states";
import { Button } from "@/components/ui/button";
import { useDialogBusy } from "@/hooks/use-dialog-busy";
import { useAccess } from "../use-funds";
import { AccessForm } from "./access-form";
import { useAccessFlow } from "./use-access-flow";

export function AccessPage({
  agent,
  onBack,
  onContinue,
  plain = false,
}: {
  agent: AgentView;
  onBack: () => void;
  onContinue: () => void;
  plain?: boolean;
}) {
  const access = useAccess(agent.id);
  const flow = useAccessFlow(agent, onContinue);
  useDialogBusy(flow.active);

  return (
    <SetupFlowPanel
      plain={plain}
      hideHeading={plain}
      step={4}
      optional={!plain}
      title="Authorize dashboard"
      description={`${plain ? "Optional. " : ""}Set dashboard access duration. Account rules and spending budgets still apply.`}
      footer={
        access.isPending || access.isError ? (
          <Button
            variant={access.data ? "default" : "outline"}
            disabled={flow.active}
            onClick={onContinue}
          >
            {access.data ? "Continue" : "Skip for now"}
          </Button>
        ) : undefined
      }
    >
      {access.isPending ? (
        <Loading />
      ) : access.isError ? (
        <Unavailable code={access.error.message} onRetry={() => void access.refetch()} />
      ) : (
        <AccessForm
          key={access.data?.grantId ?? "none"}
          agentId={agent.id}
          current={access.data ?? null}
          busy={flow.active}
          error={flow.error}
          onSubmit={flow.enable}
          navigation={{
            onBack,
            onContinue,
            continueLabel: access.data ? "Continue" : "Skip for now",
          }}
        />
      )}
      {flow.dialogs()}
    </SetupFlowPanel>
  );
}
