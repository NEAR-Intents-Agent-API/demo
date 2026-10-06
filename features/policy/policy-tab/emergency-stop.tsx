"use client";

import type { PolicyView } from "@near-intents-agent-api/sdk";
import { Button } from "@/components/ui/button";
import { errorMessage } from "@/lib/http/messages";
import { PolicySettingRow } from "./settings/policy-setting-row";
import { usePolicyWorkflow } from "./use-policy-workflow";

/** The emergency stop is its own action with its own signature; it never shares the save bar. */
export function EmergencyStop({ agentId, view }: { agentId: string; view: PolicyView }) {
  const workflow = usePolicyWorkflow(agentId);
  const frozen = Boolean(view.policy?.frozen);
  const busy = workflow.save.isPending;
  return (
    <div>
      <PolicySettingRow
        title="Emergency stop"
        description={
          frozen
            ? "No swap, transfer or withdrawal can run. Unfreeze to restore the rules above."
            : "Freeze to block every move. Account rules remain saved."
        }
        value={
          <span className={frozen ? "text-destructive" : "text-muted-foreground"}>
            {frozen ? "Frozen" : "Not frozen"}
          </span>
        }
        action={
          <Button
            size="sm"
            variant="outline"
            className={frozen ? "text-primary" : "text-destructive"}
            disabled={busy}
            onClick={() =>
              view.policy && workflow.save.mutate({ ...view.policy, frozen: !view.policy.frozen })
            }
          >
            {busy ? "Working…" : frozen ? "Sign and unfreeze" : "Sign and freeze"}
          </Button>
        }
      />
      {workflow.save.error ? (
        <p role="alert" className="px-5 pb-4 text-sm text-destructive">
          {errorMessage(workflow.save.error.message)}
        </p>
      ) : null}
    </div>
  );
}
