"use client";

import { ResponsiveDialog } from "@/components/responsive-dialog";
import { Callout } from "@/components/shared/callout";
import { Pending } from "@/components/shared/states";
import { Button } from "@/components/ui/button";
import { type ConsentChallenge, type ConsentStage, SigningSummary } from "@/features/wallet/index";
import { cn } from "@/lib/utils";
import { type DeletionSummary, STEP_CONFIRM } from "./lifecycle-state";

/**
 * The one irreversible action, so it shows what the account holds before it asks for a signature.
 * Deletion has no sweep: the API refuses it while the account holds any public or private balance,
 * so the server's preview (`generated.preview.deletion`) blocks signing until the funds are moved
 * out. Native funds at the agent's own addresses are not inventoried, so the dialog tells the
 * owner to move them first.
 */
export function DeleteAccountDialog({
  open,
  onOpenChange,
  summary,
  challenge,
  stage,
  error,
  onSign,
  onRetry,
}: {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  summary: DeletionSummary | null;
  challenge: ConsentChallenge | null;
  stage: ConsentStage;
  error: string | null;
  onSign: () => void;
  onRetry: () => void;
}) {
  const busy = stage === "signing" || stage === "submitting";
  const ready = Boolean(challenge && summary && !summary.holdsFunds);

  return (
    <ResponsiveDialog
      open={open}
      onOpenChange={onOpenChange}
      title="Delete this agent account"
      description="The account is removed for good. Its history stays readable, but it can never run again."
      busy={busy}
      contentClassName="sm:max-w-2xl"
      footer={
        <DeleteFooter
          stage={stage}
          ready={ready}
          retryable={stage === "error" && !challenge}
          onCancel={() => onOpenChange(false)}
          onSign={onSign}
          onRetry={onRetry}
        />
      }
    >
      <div className="flex min-w-0 flex-col gap-5">
        {summary ? (
          <Holdings summary={summary} />
        ) : (
          <p className="text-sm text-muted-foreground">
            {error ? "Could not prepare the deletion." : "Checking what the account holds…"}
          </p>
        )}
        {challenge ? (
          <SigningSummary
            owner={challenge.owner}
            message={challenge.displayMessage ?? JSON.stringify(challenge.message)}
          />
        ) : null}
        {error ? (
          <p className="rounded-xl border border-destructive/25 bg-destructive/5 px-4 py-3 text-sm text-destructive">
            {error}
          </p>
        ) : null}
      </div>
    </ResponsiveDialog>
  );
}

function Holdings({ summary }: { summary: DeletionSummary }) {
  return (
    <div className="flex flex-col gap-4">
      {summary.holdsFunds ? (
        <Callout tone="danger" title="Move these balances out first">
          Deleting sends nothing anywhere, and the API refuses it while the account holds any public
          or private balance. Withdraw or transfer everything out, then delete the account.
        </Callout>
      ) : (
        <Callout tone="info" title="Ready to delete">
          The account holds no tokens, so nothing needs to be moved out first.
        </Callout>
      )}
      {summary.rows.length > 0 ? (
        <ul className="flex flex-col divide-y rounded-xl border">
          {summary.rows.map((row) => (
            <li
              key={row.key}
              className="flex items-center justify-between gap-3 px-4 py-2.5 text-sm"
            >
              <span className="flex items-center gap-2">
                {row.label}
                <span
                  className={cn(
                    "text-xs text-muted-foreground",
                    row.scope === "private" && "italic",
                  )}
                >
                  {row.scope === "private" ? "Private balance" : "Public balance"}
                </span>
              </span>
              <span className="font-mono">{row.amount}</span>
            </li>
          ))}
        </ul>
      ) : null}
      <p className="text-sm text-muted-foreground">
        Only the account's public and private balances are listed. Native NEAR, EVM and Solana funds
        at the agent's own addresses are not, and deletion loses them (native NEAR goes to the
        sponsor); move them out before you delete.
      </p>
    </div>
  );
}

function DeleteFooter({
  stage,
  ready,
  retryable,
  onCancel,
  onSign,
  onRetry,
}: {
  stage: ConsentStage;
  ready: boolean;
  /** Nothing is prepared and the last attempt failed: offer a fresh request. */
  retryable: boolean;
  onCancel: () => void;
  onSign: () => void;
  onRetry: () => void;
}) {
  const busy = stage === "signing" || stage === "submitting";
  return (
    <div className="flex flex-col gap-3">
      <p className="text-xs leading-5 text-muted-foreground">
        Nothing is sent until you sign. Deleting cannot be undone.
      </p>
      <div className="flex flex-col-reverse items-stretch justify-end gap-2 sm:flex-row sm:items-center">
        <Button variant="link" onClick={onCancel} disabled={busy}>
          Cancel
        </Button>
        {retryable ? (
          <Button size="lg" onClick={onRetry}>
            Prepare again
          </Button>
        ) : (
          <Button variant="destructive" size="lg" onClick={onSign} disabled={!ready || busy}>
            {busy ? <Pending /> : null}
            {stage === "signing"
              ? "Waiting for your wallet…"
              : stage === "submitting"
                ? "Deleting…"
                : STEP_CONFIRM.agent_delete}
          </Button>
        )}
      </div>
    </div>
  );
}
