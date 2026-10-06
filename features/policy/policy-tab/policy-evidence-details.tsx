import type { PolicyView } from "@near-intents-agent-api/sdk";
import { MonoId } from "@/components/shared/identifiers";
import { PolicySettingRow } from "./settings/policy-setting-row";

export function PolicyEvidenceDetails({ view }: { view: PolicyView }) {
  return (
    <div className="divide-y">
      <PolicySettingRow
        title="Rule revision"
        description="Version of the installed account rules."
        value={view.revision ?? "—"}
      />
      <PolicySettingRow
        title="Installed"
        description="When these account rules were installed."
        value={view.applied_at ? new Date(view.applied_at).toLocaleString() : "—"}
      />
      <PolicySettingRow
        title="Provider readback"
        description="Confirms the provider matches the installed rules."
        value={view.provider_policy_synced ? "Matches installed rules" : "Pending confirmation"}
      />
      <PolicySettingRow
        title="Policy hash"
        description="Identifier of the installed policy."
        value={
          view.policy_hash ? (
            <MonoId value={view.policy_hash} head={8} tail={6} className="max-w-full" />
          ) : (
            "—"
          )
        }
      />
      <PolicySettingRow
        title="Transaction"
        description="Transaction recorded for the rules update."
        value={
          view.transaction_hash ? (
            <MonoId value={view.transaction_hash} head={8} tail={6} className="max-w-full" />
          ) : (
            "—"
          )
        }
      />
    </div>
  );
}
