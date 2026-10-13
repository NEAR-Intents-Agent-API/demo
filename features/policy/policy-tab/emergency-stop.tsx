"use client";

import type { PolicyView } from "@near-intents-agent-api/sdk";
import { Button } from "@/components/ui/button";
import { errorMessage } from "@/lib/http/messages";
import { PolicySettingRow } from "./settings/policy-setting-row";
import { useCooldown } from "./use-cooldown";
import { usePolicyWorkflow } from "./use-policy-workflow";

/**
 * The emergency stop is its own action with its own signature; it never shares the save bar and
 * never carries a rulebook: the API restates the rules it has applied with only the freeze flag
 * changed, so no stale tab or unfinished rules change can ride along. Freezing skips the rules
 * cooldown; unfreezing has its own.
 */
export function EmergencyStop({ agentId, view }: { agentId: string; view: PolicyView }) {
  const workflow = usePolicyWorkflow(agentId);
  const frozen = Boolean(view.policy?.frozen);
  const busy = workflow.setFrozen.isPending;
  const unfreezeAvailableAt = useCooldown(view.cooldowns.unfreeze_available_at);
  const waiting = frozen ? unfreezeAvailableAt : null;
  return (
    <div>
      <PolicySettingRow
        title="Emergency stop"
        description={
          frozen
            ? "No swap, transfer or withdrawal can run, and deposits are refused too. Unfreeze to restore the rules above."
            : "Freeze to block every move, takes effect as soon as it is confirmed. Account rules remain saved."
        }
        value={
          <span className="flex flex-col gap-1">
            <span className={frozen ? "text-destructive" : "text-muted-foreground"}>
              {frozen ? "Frozen" : "Not frozen"}
            </span>
            {waiting ? (
              <span role="status" className="text-xs text-muted-foreground">
                You can unfreeze at {waiting.toLocaleString()}.
              </span>
            ) : null}
          </span>
        }
        action={
          <Button
            size="sm"
            variant="outline"
            className={frozen ? "text-primary" : "text-destructive"}
            disabled={busy || Boolean(waiting)}
            onClick={() => workflow.setFrozen.mutate(!frozen)}
          >
            {busy ? "Working…" : frozen ? "Sign and unfreeze" : "Sign and freeze"}
          </Button>
        }
      />
      {workflow.setFrozen.error ? (
        <p role="alert" className="px-5 pb-4 text-sm text-destructive">
          {errorMessage(workflow.setFrozen.error)}
        </p>
      ) : null}
    </div>
  );
}
