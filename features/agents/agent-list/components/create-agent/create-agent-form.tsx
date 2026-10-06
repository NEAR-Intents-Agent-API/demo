"use client";

import type { UseFormReturn } from "react-hook-form";
import { SetupFlowPanel } from "@/components/shared/setup-flow-panel";
import { type Rules, rulesProblem } from "@/features/policy/model";
import type { CreateInput } from "../../../model/schemas";
import { CreateActions } from "./create-actions";
import { NameStep } from "./name-step";
import { RulesStep } from "./rules-step";
import type { useCreateFlow } from "./use-create-flow";

const FORM_ID = "create-agent-form";

/**
 * Creating an account takes one screen and one signature: name it, look over the rules it starts
 * with, then sign. The editor is one click away for owners who want to narrow the defaults before
 * they sign; nobody is asked to configure five sections they have not thought about yet.
 *
 * The form is the activation step of the account setup dialog.
 */
export function CreateAgentForm({
  form,
  rules,
  onRulesChange,
  pending,
  stage,
  error,
  onSubmit,
  hasPendingActivation,
  flow,
  plain = false,
}: {
  form: UseFormReturn<CreateInput>;
  rules: Rules;
  onRulesChange: (rules: Rules) => void;
  pending: boolean;
  hasPendingActivation: boolean;
  plain?: boolean;
  flow: ReturnType<typeof useCreateFlow>;
  stage: string;
  error: string | null;
  onSubmit: (values: CreateInput) => void;
}) {
  const { step, setStep, editing, setEditing } = flow;
  const locked = pending || hasPendingActivation;
  const showRules = step === "rules";

  const submit = form.handleSubmit((values) => {
    if (showRules) onSubmit(values);
    else {
      setEditing(false);
      setStep("rules");
    }
  });

  return (
    <SetupFlowPanel
      plain={plain}
      hideHeading={plain}
      step={showRules ? 2 : 1}
      title={showRules ? "Review rules" : undefined}
      description={
        showRules
          ? "These rules are installed by your signature and can be changed later."
          : undefined
      }
      footer={
        <div className="flex w-full flex-col gap-3">
          {error ? (
            <p role="alert" className="text-sm text-destructive">
              {error}
            </p>
          ) : null}
          <CreateActions
            formId={FORM_ID}
            step={step}
            pending={pending}
            stage={stage}
            nameValid={Boolean(form.watch("name").trim())}
            blocked={Boolean(rulesProblem(rules))}
            hasPendingActivation={hasPendingActivation}
          />
        </div>
      }
    >
      <form
        id={FORM_ID}
        className="flex flex-col gap-4"
        onSubmit={(event) => {
          event.preventDefault();
          void submit(event);
        }}
      >
        {showRules ? (
          <RulesStep
            rules={rules}
            onRulesChange={onRulesChange}
            pending={pending}
            hasPendingActivation={hasPendingActivation}
            editing={editing}
            onEditingChange={setEditing}
          />
        ) : (
          <NameStep form={form} locked={locked} />
        )}
      </form>
    </SetupFlowPanel>
  );
}
