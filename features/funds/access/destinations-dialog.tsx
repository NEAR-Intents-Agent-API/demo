"use client";

import type { DestinationRule } from "@near-intents-agent-api/sdk";
import { useState } from "react";
import { ResponsiveDialog } from "@/components/responsive-dialog";
import { Pending } from "@/components/shared/states";
import { Button } from "@/components/ui/button";
import type { IntentStep } from "@/features/intents";
import type { ConsentStage } from "@/features/wallet";
import type { DestinationSettings } from "../api";
import { DestinationRuleFields } from "./destination-rule-fields";
import type { DestinationContext } from "./destination-utils";
import { SignatureDetails } from "./signature-details";
import { signatureLabel } from "./signature-utils";

export function DestinationsDialog({
  open,
  onOpenChange,
  current,
  initial,
  busy,
  error,
  stage,
  prepared,
  onSubmit,
}: {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  current: DestinationSettings;
  initial?: DestinationContext;
  busy: boolean;
  error: string | null;
  stage: ConsentStage;
  prepared: IntentStep | null;
  onSubmit: (rule: DestinationRule, revision: number) => void;
}) {
  const [rule, setRule] = useState<DestinationRule>(current.rule);
  const [pendingDestination, setPendingDestination] = useState(false);
  const changed = JSON.stringify(rule) !== JSON.stringify(current.rule);
  const title =
    initial?.action === "withdraw"
      ? "Approve a withdrawal address"
      : initial
        ? "Approve a transfer recipient"
        : "Where funds can go";
  const cooling = Boolean(current.availableAt && Date.parse(current.availableAt) > Date.now());
  return (
    <ResponsiveDialog
      open={open}
      onOpenChange={onOpenChange}
      busy={busy}
      title={title}
      description="One account rule for the dashboard and every connected client. No grant is signed again."
      footer={
        <div className="flex flex-col gap-3">
          {error ? (
            <p role="alert" className="text-sm text-destructive">
              {error}
            </p>
          ) : null}
          {pendingDestination ? (
            <p className="text-xs text-muted-foreground">
              Add your entered destination to the list before signing.
            </p>
          ) : null}
          {cooling ? (
            <p role="status" className="text-xs text-muted-foreground">
              Account-rule cooldown: changes available{" "}
              {new Date(current.availableAt ?? "").toLocaleString()}. You can prepare several
              destinations and save them together.
            </p>
          ) : null}
          <Button
            size="lg"
            className="w-full"
            disabled={
              busy || cooling || !changed || pendingDestination || current.revision === null
            }
            onClick={() => {
              if (current.revision !== null) onSubmit(rule, current.revision);
            }}
          >
            {busy ? <Pending /> : null}
            {signatureLabel(stage, "Sign to save destinations")}
          </Button>
        </div>
      }
    >
      <div className="flex flex-col gap-4">
        <fieldset disabled={busy}>
          <legend className="sr-only">Destination rule</legend>
          <DestinationRuleFields
            value={rule}
            onChange={setRule}
            initial={initial}
            onDraftChange={setPendingDestination}
          />
        </fieldset>
        <p className="text-xs leading-5 text-muted-foreground">
          One signature saves this rule; it sends no funds and needs no blockchain transaction.
          Swaps and shield/unshield need no destination. Previously queued executions become stale
          after changes; already dispatched operations may complete.
        </p>
        <SignatureDetails step={prepared} />
      </div>
    </ResponsiveDialog>
  );
}
