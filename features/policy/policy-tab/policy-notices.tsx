"use client";

import { Callout } from "@/components/shared/callout";
import { Button } from "@/components/ui/button";
import { type Rules, rulesFromPolicy } from "../rules/rules";
import type { PendingChange } from "./pending-change";
import type { usePolicyWorkflow } from "./use-policy-workflow";

/** What stands between the owner and the next signature, and what to do about it. */
export function PolicyNotices({
  editing,
  busy,
  conflict,
  pending,
  changeAvailableAt,
  workflow,
  onReview,
  onDiscard,
}: {
  editing: Rules | null;
  busy: boolean;
  conflict: boolean;
  pending: PendingChange;
  changeAvailableAt: Date | null;
  workflow: ReturnType<typeof usePolicyWorkflow>;
  onReview: (rules: Rules) => void;
  onDiscard: () => void;
}) {
  return (
    <>
      {conflict ? (
        <Callout
          tone="warning"
          compact
          action={
            editing ? (
              <Button size="sm" variant="outline" onClick={onDiscard}>
                Discard my changes
              </Button>
            ) : undefined
          }
        >
          {editing
            ? "The rules changed in another tab or window after you started editing. Your unsaved changes were based on the old rules; discard them to see the current ones."
            : "The rules changed in another tab or window while you were editing, so your changes were not signed. The rules above are the current ones."}
        </Callout>
      ) : null}
      {!editing && !busy && pending.kind === "signable" ? (
        <Callout
          tone="warning"
          compact
          action={
            <Button size="sm" onClick={() => onReview(rulesFromPolicy(pending.policy))}>
              Review change
            </Button>
          }
        >
          A rules change you started earlier is waiting for your signature. Review it before you
          sign; nothing is signed until you do.
        </Callout>
      ) : null}
      {pending.kind === "in_flight" ? (
        <Callout
          tone="warning"
          compact
          action={
            <Button
              size="sm"
              variant="outline"
              disabled={workflow.check.isPending}
              onClick={() => workflow.check.mutate(pending.step.generated.correlation_id)}
            >
              Check status
            </Button>
          }
        >
          {pending.needsReview
            ? "An earlier rules change has an outcome that is not confirmed yet and needs review. It will not be signed again, and new changes wait until it settles."
            : "An earlier rules change was signed and is still being applied. New changes wait until it settles."}
        </Callout>
      ) : null}
      {!editing && changeAvailableAt ? (
        <Callout tone="info" compact>
          The next rules change is possible at {changeAvailableAt.toLocaleString()}. Freezing the
          account stays available.
        </Callout>
      ) : null}
    </>
  );
}
