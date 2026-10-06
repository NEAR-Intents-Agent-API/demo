"use client";

import type { AgentView } from "@near-intents-agent-api/sdk";
import type { ReactNode } from "react";
import { Loading, Unavailable } from "@/components/shared/states";
import type { AccountSetupStep } from "../../model/tabs";
import type { useWalletSetup } from "../hooks/use-wallet-setup";
import { AccountSetupDialogContent } from "./account-setup-dialog-content";
import { AccountSetupDialogFrame } from "./account-setup-dialog-frame";

export function AccountSetupDialog({
  agent,
  step,
  setup,
  deposit,
  busy,
  onStep,
  onClose,
}: {
  agent: AgentView;
  step: AccountSetupStep;
  setup: ReturnType<typeof useWalletSetup>;
  deposit: ReactNode;
  busy: boolean;
  onStep: (step: AccountSetupStep) => void;
  onClose: () => void;
}) {
  return (
    <AccountSetupDialogFrame
      title={setup.steps.find((item) => item.id === step)?.title ?? "Account setup"}
      description="Add funds and connect a client. Unfinished steps remain visible on your account when you close setup."
      busy={busy}
      onClose={onClose}
    >
      {!setup.settled ? (
        <Loading rows={2} />
      ) : setup.error ? (
        <Unavailable code={setup.error.message} onRetry={() => void setup.refresh()} />
      ) : (
        <AccountSetupDialogContent
          agent={agent}
          step={step}
          steps={setup.steps}
          deposit={deposit}
          onStep={onStep}
          onClose={onClose}
        />
      )}
    </AccountSetupDialogFrame>
  );
}
