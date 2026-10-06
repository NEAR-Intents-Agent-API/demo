"use client";

import { errorMessage } from "@/lib/http/messages";
import { AccountSetupDialogFrame } from "../../../agent-detail/components/account-setup-dialog-frame";
import { SetupProgress } from "../../../agent-detail/components/setup-progress";
import { useCreateAccountDialog } from "../../hooks/use-create-account-dialog";
import { CreateAgentForm } from "./create-agent-form";
import { CREATE_SETUP_STEPS } from "./create-setup-steps";
import { useCreateFlow } from "./use-create-flow";

export function CreateAccountDialog() {
  const { view, close } = useCreateAccountDialog();
  const flow = useCreateFlow(close);
  return (
    <AccountSetupDialogFrame
      title={
        flow.step === "name" ? "Name your account" : flow.editing ? "Edit rules" : "Review rules"
      }
      description="Activate your account, add funds and connect your client. Dashboard access is optional."
      busy={view.create.isPending}
      onClose={flow.dismiss}
    >
      <SetupProgress
        steps={CREATE_SETUP_STEPS.map((step) =>
          step.id === "name"
            ? {
                ...step,
                done: flow.step === "rules",
                onClick: () => flow.setStep("name"),
              }
            : step,
        )}
        activeStepId={flow.step === "name" ? "name" : "live"}
        disabled={view.create.isPending || view.hasPendingActivation}
      />
      <CreateAgentForm
        plain
        flow={flow}
        form={view.form}
        rules={view.rules}
        onRulesChange={view.setRules}
        pending={view.create.isPending}
        stage={view.stage}
        error={view.create.error ? errorMessage(view.create.error.message) : null}
        onSubmit={view.submit}
        hasPendingActivation={view.hasPendingActivation}
      />
    </AccountSetupDialogFrame>
  );
}
