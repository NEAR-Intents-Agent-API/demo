"use client";

import type { OwnerWallet } from "@near-intents-agent-api/sdk";
import { ResponsiveDialog } from "@/components/responsive-dialog";
import { Pending } from "@/components/shared/states";
import { Button } from "@/components/ui/button";
import { SigningSummary } from "./signing-summary";

export type ConsentChallenge = {
  owner: OwnerWallet;
  message: Record<string, unknown>;
  displayMessage?: string;
};

export type ConsentStage = "idle" | "preparing" | "signing" | "submitting" | "error";

function buttonLabel(stage: ConsentStage, retryable: boolean, confirmLabel: string) {
  if (stage === "signing") return "Waiting for your wallet…";
  if (stage === "submitting") return "Submitting…";
  return retryable ? "Prepare again" : confirmLabel;
}

/**
 * The signature ceremony, as one dialog.
 *
 * Every owner-authorized action in the demo funnels through here, so the shape is always the
 * same: what you are signing, the exact bytes, then one confirmation button. It never
 * paraphrases the payload — the summary is a reading aid and the raw message is always one
 * click away, because that text is what the wallet will actually sign.
 */
export function ConsentDialog({
  open,
  onOpenChange,
  title,
  description,
  challenge,
  stage,
  error,
  confirmLabel,
  onSign,
  onRetry,
}: {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  title: string;
  description: string;
  challenge: ConsentChallenge | null;
  stage: ConsentStage;
  error: string | null;
  confirmLabel: string;
  /** Signs and submits one prepared challenge. Rejections set the error state in the caller. */
  onSign: (challenge: ConsentChallenge) => Promise<void>;
  /** When no message could be prepared, or the prepared one is spent, asks for a fresh one. */
  onRetry?: () => void;
}) {
  const busy = stage === "submitting" || stage === "signing";
  const retryable = Boolean(onRetry) && !challenge && stage === "error";

  const footer = (
    <div className="flex flex-col gap-3">
      <p className="text-xs leading-5 text-muted-foreground">
        Nothing is sent until you sign. The server verifies the signature before it acts.
      </p>
      <div className="flex flex-col-reverse items-stretch justify-end gap-2 sm:flex-row sm:items-center">
        <Button variant="link" onClick={() => onOpenChange(false)} disabled={busy}>
          Cancel
        </Button>
        <Button
          onClick={() => {
            if (retryable) onRetry?.();
            else if (challenge) void onSign(challenge);
          }}
          size="lg"
          disabled={(!challenge && !retryable) || busy}
        >
          {busy ? <Pending /> : null}
          {buttonLabel(stage, retryable, confirmLabel)}
        </Button>
      </div>
    </div>
  );

  return (
    <ResponsiveDialog
      open={open}
      onOpenChange={onOpenChange}
      title={title}
      description={description}
      busy={busy}
      contentClassName="sm:max-w-2xl"
      footer={footer}
    >
      <div className="flex min-w-0 flex-col gap-5">
        {challenge ? (
          <SigningSummary
            owner={challenge.owner}
            message={challenge.displayMessage ?? JSON.stringify(challenge.message)}
          />
        ) : stage === "error" ? null : (
          <p className="text-sm text-muted-foreground">
            Asking the server for the exact message to sign…
          </p>
        )}

        {error ? (
          <p className="rounded-xl border border-destructive/25 bg-destructive/5 px-4 py-3 text-sm text-destructive">
            {error}
          </p>
        ) : null}
      </div>
    </ResponsiveDialog>
  );
}
