"use client";

import {
  Archive02Icon,
  Delete02Icon,
  MoreHorizontalIcon,
  RotateClockwiseIcon,
} from "@hugeicons/core-free-icons";
import { HugeiconsIcon } from "@hugeicons/react";
import type { AgentView } from "@near-intents-agent-api/sdk";
import { Button } from "@/components/ui/button";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { ConsentDialog } from "@/features/wallet/index";
import { DeleteAccountDialog } from "./delete-account-dialog";
import {
  deletionSummary,
  type LifecycleAction,
  lifecycleActions,
  STEP_CONFIRM,
  STEP_TITLE,
  stepDescription,
} from "./lifecycle-state";
import { useAccountLifecycle } from "./use-account-lifecycle";

const ACTION_LABEL: Record<LifecycleAction, string> = {
  archive: "Archive account",
  restore: "Restore account",
  delete: "Delete account",
};

const ACTION_ICON = {
  archive: Archive02Icon,
  restore: RotateClockwiseIcon,
  delete: Delete02Icon,
};

/**
 * Archive, restore and delete for one account, in a menu so the header keeps one obvious
 * primary action. A disabled entry says why underneath instead of failing after a signature.
 */
export function AccountLifecycleActions({ agent }: { agent: AgentView }) {
  const actions = lifecycleActions(agent.status);
  // Rules and provider views exist only for live accounts, so nothing is read for the others.
  return actions.length === 0 ? null : <LifecycleMenu agent={agent} actions={actions} />;
}

function LifecycleMenu({ agent, actions }: { agent: AgentView; actions: LifecycleAction[] }) {
  const lifecycle = useAccountLifecycle(agent);
  const { run } = lifecycle;
  const step = run?.steps[run.index];
  const deletion = run?.step?.generated.preview.deletion;

  return (
    <>
      <DropdownMenu>
        <DropdownMenuTrigger
          render={
            <Button variant="outline" size="sm" aria-label="Account lifecycle actions">
              <HugeiconsIcon icon={MoreHorizontalIcon} className="size-4" />
            </Button>
          }
        />
        <DropdownMenuContent align="end" className="w-72">
          {actions.map((action) => {
            const plan = lifecycle.plan(action);
            return (
              <div key={action}>
                {action === "delete" ? <DropdownMenuSeparator /> : null}
                <DropdownMenuItem
                  variant={action === "delete" ? "destructive" : "default"}
                  disabled={!plan.ok}
                  onClick={() => lifecycle.start(action)}
                >
                  <HugeiconsIcon icon={ACTION_ICON[action]} className="size-4" />
                  <span className="flex min-w-0 flex-col gap-0.5">
                    {ACTION_LABEL[action]}
                    {plan.ok ? null : (
                      <span className="text-xs font-normal whitespace-normal text-muted-foreground">
                        {plan.reason}
                      </span>
                    )}
                  </span>
                </DropdownMenuItem>
              </div>
            );
          })}
        </DropdownMenuContent>
      </DropdownMenu>
      {run?.action === "delete" ? (
        <DeleteAccountDialog
          open
          onOpenChange={(open) => {
            if (!open) lifecycle.close();
          }}
          summary={deletion ? deletionSummary(deletion) : null}
          challenge={lifecycle.challenge}
          stage={lifecycle.stage}
          error={lifecycle.error}
          onSign={() => void lifecycle.sign()}
          onRetry={lifecycle.retry}
        />
      ) : (
        <ConsentDialog
          open={run !== null}
          onOpenChange={(open) => {
            if (!open) lifecycle.close();
          }}
          title={step ? STEP_TITLE[step] : ""}
          description={run && step ? stepDescription(step, run.index, run.steps.length) : ""}
          challenge={lifecycle.challenge}
          stage={lifecycle.stage}
          error={lifecycle.error}
          confirmLabel={step ? STEP_CONFIRM[step] : "Sign"}
          onSign={lifecycle.sign}
          onRetry={lifecycle.retry}
        />
      )}
    </>
  );
}
