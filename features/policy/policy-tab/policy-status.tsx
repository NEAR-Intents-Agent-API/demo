"use client";

import type { PolicyView } from "@near-intents-agent-api/sdk";
import { Callout } from "@/components/shared/callout";
import { Disclosure } from "@/components/shared/disclosure";
import { MonoId } from "@/components/shared/identifiers";
import { StatusPill } from "@/components/shared/status";
import { rulesState } from "@/lib/policy/rules-state";

export function PolicyState({ view }: { view: PolicyView }) {
  const state = rulesState(view);
  if (state === "in_force") return <StatusPill tone="ok">In force</StatusPill>;
  if (state === "not_applied") return <StatusPill tone="attention">Not applied</StatusPill>;
  if (state === "none") return <StatusPill tone="attention">No rules</StatusPill>;
  return <StatusPill tone="attention">Applying</StatusPill>;
}

/**
 * Signed is not in force. Until the provider confirms the latest revision the API refuses every
 * move, so the rules shown must not read as usable limits yet.
 */
export function ApplyingNotice({ state }: { state: ReturnType<typeof rulesState> }) {
  if (state === "in_force" || state === "none") return null;
  return (
    <Callout tone="warning" className="mb-4">
      {state === "not_applied"
        ? "These rules were signed but did not apply. Moves stay paused until a rules change applies; edit and sign again."
        : "Applying these rules. Moves pause until the provider confirms them, then they take effect for every client."}
    </Callout>
  );
}

/** The chain evidence behind the rules, for whoever wants to check it. */
export function PolicyEvidence({ view }: { view: PolicyView }) {
  return (
    <Disclosure
      className="mt-5 border-t pt-4"
      summary={
        <>
          Rule details · revision {view.revision ?? "—"}
          {view.applied_at ? ` · installed ${new Date(view.applied_at).toLocaleString()}` : ""}
        </>
      }
    >
      <dl className="mt-3 grid gap-2 rounded-lg border bg-muted/30 p-3 sm:grid-cols-3">
        <Proof label="Provider readback">
          {view.provider_policy_synced ? "matches" : "pending"}
        </Proof>
        <Proof label="Policy hash">
          {view.policy_hash ? <MonoId value={view.policy_hash} head={8} tail={6} /> : "—"}
        </Proof>
        <Proof label="Transaction">
          {view.transaction_hash ? <MonoId value={view.transaction_hash} head={8} tail={6} /> : "—"}
        </Proof>
      </dl>
    </Disclosure>
  );
}

function Proof({ label, children }: { label: string; children: React.ReactNode }) {
  return (
    <div className="flex flex-col gap-0.5">
      <dt className="text-muted-foreground">{label}</dt>
      <dd className="text-foreground">{children}</dd>
    </div>
  );
}
