"use client";

import { ArrowRight01Icon, RefreshIcon } from "@hugeicons/core-free-icons";
import { HugeiconsIcon } from "@hugeicons/react";
import type { AgentView } from "@near-intents-agent-api/sdk";
import { StatusPill } from "@/components/shared/status";
import { Button } from "@/components/ui/button";
import { accountDate } from "@/lib/format/date";
import { cn } from "@/lib/utils";
import type { AgentState } from "../../model/agent-state";
import { useAccountDetailsDialog } from "../hooks/use-account-details-dialog";
import { AccountDetailsDialog } from "./account-details-dialog";

/**
 * Who this account is, at the top of every tab: name, state, owner and age. Identifiers and the
 * three-claims record sit behind "Account details" because they answer "is this really mine?"
 * rather than "what do I do here?".
 */
export function AgentHeader({
  agent,
  state,
  refreshing,
  onRefresh,
  framed = false,
}: {
  agent: AgentView;
  state: AgentState;
  refreshing: boolean;
  onRefresh: () => void;
  framed?: boolean;
}) {
  const details = useAccountDetailsDialog();
  const tone =
    state.stage === "ready"
      ? "ok"
      : state.stage === "archived" || state.stage === "abandoned"
        ? "blocked"
        : "attention";
  return (
    <header className={cn("flex flex-col gap-5", framed && "rounded-xl border bg-card p-5 sm:p-6")}>
      <div className="flex min-w-0 flex-1 flex-col gap-4">
        <div className="flex flex-wrap items-start justify-between gap-3">
          <div className="min-w-0">
            <div className="flex flex-wrap items-center gap-2.5">
              <h1 className="console-title text-2xl normal-case">{agent.name}</h1>
              <StatusPill tone={tone}>{state.label}</StatusPill>
            </div>
            <div className="mt-1.5 flex flex-wrap items-center gap-x-4 gap-y-1 text-xs text-muted-foreground">
              {agent.owner ? <span>Owner · {agent.owner.type}</span> : null}
              <span>Created · {accountDate(agent.created_at)}</span>
            </div>
          </div>
          <Button
            variant="outline"
            size="sm"
            aria-label="Refresh all account data"
            onClick={onRefresh}
            disabled={refreshing}
          >
            <HugeiconsIcon
              icon={RefreshIcon}
              className={refreshing ? "size-4 animate-spin" : "size-4"}
            />
            Refresh
          </Button>
        </div>
        <Button
          ref={details.trigger}
          variant="link"
          size="sm"
          className="self-start gap-2 px-0 text-muted-foreground hover:text-foreground"
          aria-haspopup="dialog"
          aria-expanded={details.open}
          onClick={details.show}
        >
          Account details
          <HugeiconsIcon icon={ArrowRight01Icon} className="size-4" aria-hidden="true" />
        </Button>
      </div>
      <AccountDetailsDialog
        agent={agent}
        open={details.open}
        onOpenChange={details.setOpen}
        returnFocus={details.trigger}
      />
    </header>
  );
}
