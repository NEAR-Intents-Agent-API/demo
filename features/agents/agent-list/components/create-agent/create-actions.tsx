"use client";

import { ArrowRight01Icon, SecurityLockIcon } from "@hugeicons/core-free-icons";
import { HugeiconsIcon } from "@hugeicons/react";
import { Pending } from "@/components/shared/states";
import { Button } from "@/components/ui/button";

/** Activation actions: review the rules after naming, then sign the existing request. */
export function CreateActions({
  formId,
  step,
  pending,
  stage,
  nameValid,
  blocked,
  hasPendingActivation,
  editing,
  onReview,
}: {
  formId: string;
  step: "name" | "rules";
  pending: boolean;
  stage: string;
  nameValid: boolean;
  blocked: boolean;
  hasPendingActivation: boolean;
  /** The editor is open: the button reviews the summary instead of signing. */
  editing: boolean;
  onReview: () => void;
}) {
  const rules = step === "rules";
  return (
    <div className="flex w-full items-center gap-3">
      <Button
        type={editing ? "button" : "submit"}
        form={formId}
        onClick={editing ? onReview : undefined}
        size="lg"
        className="h-auto min-h-11 min-w-0 w-full whitespace-normal"
        disabled={pending || (rules ? blocked : !nameValid)}
      >
        {pending ? <Pending /> : null}
        {pending ? (
          stage || "Creating…"
        ) : (
          <ActionLabel step={step} editing={editing} resume={hasPendingActivation} />
        )}
      </Button>
    </div>
  );
}

function ActionLabel({
  step,
  editing,
  resume,
}: {
  step: "name" | "rules";
  editing: boolean;
  resume: boolean;
}) {
  if (step === "rules" && !editing)
    return (
      <>
        <HugeiconsIcon icon={SecurityLockIcon} className="size-4" />
        {resume ? "Resume activation" : "Sign and create"}
      </>
    );
  return (
    <>
      {step === "rules" ? "Review summary" : "Review rules"}
      <HugeiconsIcon icon={ArrowRight01Icon} className="size-4" />
    </>
  );
}
