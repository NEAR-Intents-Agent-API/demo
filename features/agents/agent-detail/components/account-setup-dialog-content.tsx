"use client";

import type { AgentView } from "@near-intents-agent-api/sdk";
import type { ReactNode } from "react";
import { AccessPage } from "@/features/funds/index";
import { ConnectTab } from "@/features/mcp/index";
import { useDialogLocked } from "@/hooks/use-dialog-busy";
import type { AccountSetupStep } from "../../model/tabs";
import { ActivatedStep } from "./activated-step";
import { FundingStep } from "./funding-step";
import { SetupProgress } from "./setup-progress";
import type { SetupStep } from "./setup-progress-utils";

export function AccountSetupDialogContent({
  agent,
  step,
  steps,
  deposit,
  onStep,
  onClose,
}: {
  agent: AgentView;
  step: AccountSetupStep;
  steps: readonly SetupStep[];
  deposit: ReactNode;
  onStep: (step: AccountSetupStep) => void;
  onClose: () => void;
}) {
  const locked = useDialogLocked();
  let content: ReactNode;
  switch (step) {
    case "live":
      content = <ActivatedStep plain onContinue={() => onStep("fund")} />;
      break;
    case "fund":
      content = (
        <FundingStep
          plain
          funded={steps.some((item) => item.id === "fund" && item.done)}
          onBack={() => onStep("live")}
          onContinue={() => onStep("access")}
        >
          {deposit}
        </FundingStep>
      );
      break;
    case "access":
      content = (
        <AccessPage
          plain
          agent={agent}
          onBack={() => onStep("fund")}
          onContinue={() => onStep("connect")}
        />
      );
      break;
    case "connect":
      content = (
        <ConnectTab
          plain
          agentId={agent.id}
          setup={{ onBack: () => onStep("access"), onFinish: onClose }}
        />
      );
      break;
  }
  return (
    <>
      <SetupProgress steps={steps} activeStepId={step} disabled={locked} />
      {content}
    </>
  );
}
