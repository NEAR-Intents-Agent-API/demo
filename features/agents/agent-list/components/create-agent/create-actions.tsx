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
}: {
  formId: string;
  step: "name" | "rules";
  pending: boolean;
  stage: string;
  nameValid: boolean;
  blocked: boolean;
  hasPendingActivation: boolean;
}) {
  const rules = step === "rules";
  return (
    <div className="flex w-full items-center gap-3">
      <Button
        type="submit"
        form={formId}
        size="lg"
        className="h-auto min-h-11 min-w-0 w-full whitespace-normal"
        disabled={pending || (rules ? blocked : !nameValid)}
      >
        {pending ? <Pending /> : null}
        {pending ? (
          stage || "Creating…"
        ) : rules ? (
          <>
            <HugeiconsIcon icon={SecurityLockIcon} className="size-4" />
            {hasPendingActivation ? "Resume activation" : "Sign and create"}
          </>
        ) : (
          <>
            Review rules
            <HugeiconsIcon icon={ArrowRight01Icon} className="size-4" />
          </>
        )}
      </Button>
    </div>
  );
}
