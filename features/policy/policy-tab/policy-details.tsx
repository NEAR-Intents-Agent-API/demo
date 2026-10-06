"use client";
import type { PolicyView } from "@near-intents-agent-api/sdk";
import { AccessSummary } from "./access-summary";
import { PolicyEvidenceDetails } from "./policy-evidence-details";
import { TimelockPanel } from "./timelock-panel";

export function PolicyDetails({
  agentId,
  view,
  hasOwner,
  emergencyStop,
}: {
  agentId: string;
  view: PolicyView;
  hasOwner: boolean;
  emergencyStop?: React.ReactNode;
}) {
  return (
    <section className="space-y-3">
      <header>
        <h2 className="console-heading">Account management</h2>
        <p className="mt-1 text-xs leading-5 text-muted-foreground">
          Review queued executions, signed grants and rule details.
        </p>
      </header>
      <div className="divide-y overflow-hidden rounded-lg border bg-card">
        {hasOwner ? <TimelockPanel agentId={agentId} usage={view.usage.timelock} /> : null}
        <AccessSummary agentId={agentId} />
        <PolicyEvidenceDetails view={view} />
        {emergencyStop}
      </div>
    </section>
  );
}
