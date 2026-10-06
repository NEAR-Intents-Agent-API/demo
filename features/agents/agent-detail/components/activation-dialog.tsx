"use client";

import { SetupFlowPanel } from "@/components/shared/setup-flow-panel";
import type { useOnboarding } from "../hooks/use-onboarding";
import { AccountSetupDialogFrame } from "./account-setup-dialog-frame";
import { OnboardingPanel } from "./onboarding-panel";

export function ActivationDialog({
  view,
  onClose,
}: {
  view: ReturnType<typeof useOnboarding>;
  onClose: () => void;
}) {
  return (
    <AccountSetupDialogFrame
      title="Finish account activation"
      description="Continue the existing activation. An already submitted signature is only checked for confirmation."
      busy={view.finish.isPending}
      onClose={onClose}
    >
      <SetupFlowPanel
        plain
        hideHeading
        step={2}
        title="Activate account"
        description="Confirm ownership and install your account rules. Gas and storage are sponsored."
      >
        <OnboardingPanel view={view} />
      </SetupFlowPanel>
    </AccountSetupDialogFrame>
  );
}
