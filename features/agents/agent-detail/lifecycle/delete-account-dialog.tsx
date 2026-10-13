"use client";

import type { AgentView } from "@near-intents-agent-api/sdk";
import { useState } from "react";
import { ResponsiveDialog } from "@/components/responsive-dialog";
import { Callout } from "@/components/shared/callout";
import { MonoId } from "@/components/shared/identifiers";
import { Pending } from "@/components/shared/states";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { type ConsentChallenge, type ConsentStage, SigningSummary } from "@/features/wallet/index";
import { cn } from "@/lib/utils";
import { type DeletionSummary, deleteConfirmed, STEP_CONFIRM } from "./lifecycle-state";

/**
 * The one irreversible action, so it shows what it destroys before it asks for a signature.
 * The server prepares the preview (`generated.preview.deletion`); an account that still holds
 * funds also needs its exact name typed, so a stray click cannot lose them.
 */
export function DeleteAccountDialog({
  agent,
  open,
  onOpenChange,
  summary,
  challenge,
  stage,
  error,
  onSign,
}: {
  agent: AgentView;
  open: boolean;
  onOpenChange: (open: boolean) => void;
  summary: DeletionSummary | null;
  challenge: ConsentChallenge | null;
  stage: ConsentStage;
  error: string | null;
  onSign: () => void;
}) {
  const [typed, setTyped] = useState("");
  const busy = stage === "signing" || stage === "submitting";
  const ready =
    Boolean(challenge && summary) && deleteConfirmed(typed, agent.name, summary?.lost ?? true);

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
          onCancel={() => onOpenChange(false)}
          onSign={onSign}
        />
      }
    >
      <div className="flex min-w-0 flex-col gap-5">
        {summary ? (
          <>
            <Holdings summary={summary} />
            {summary.lost ? (
              <NameConfirmation
                name={agent.name}
                typed={typed}
                onTyped={setTyped}
                disabled={busy}
              />
            ) : null}
          </>
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
      {summary.lost ? (
        <Callout tone="danger" title="These balances are destroyed">
          Deleting does not send them anywhere. Move them out first with a swap, transfer or
          withdrawal if you want to keep them.
        </Callout>
      ) : (
        <Callout tone="info" title="Nothing is lost">
          The account holds no tokens, so deleting it destroys no funds.
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
      {summary.native ? (
        <p className="text-sm text-muted-foreground">
          {summary.native} NEAR held by the custody account is sent to{" "}
          <MonoId value={summary.beneficiary} className="text-xs" head={12} tail={6} />.
        </p>
      ) : null}
    </div>
  );
}

function NameConfirmation({
  name,
  typed,
  onTyped,
  disabled,
}: {
  name: string;
  typed: string;
  onTyped: (value: string) => void;
  disabled: boolean;
}) {
  return (
    <div className="flex flex-col gap-2">
      <Label htmlFor="delete-account-name">
        Type <span className="font-mono">{name}</span> to confirm
      </Label>
      <Input
        id="delete-account-name"
        value={typed}
        onChange={(event) => onTyped(event.target.value)}
        autoComplete="off"
        spellCheck={false}
        disabled={disabled}
      />
    </div>
  );
}

function DeleteFooter({
  stage,
  ready,
  onCancel,
  onSign,
}: {
  stage: ConsentStage;
  ready: boolean;
  onCancel: () => void;
  onSign: () => void;
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
        <Button variant="destructive" size="lg" onClick={onSign} disabled={!ready || busy}>
          {busy ? <Pending /> : null}
          {stage === "signing"
            ? "Waiting for your wallet…"
            : stage === "submitting"
              ? "Deleting…"
              : STEP_CONFIRM.agent_delete}
        </Button>
      </div>
    </div>
  );
}
