"use client";

import { ArrowRight01Icon } from "@hugeicons/core-free-icons";
import { HugeiconsIcon } from "@hugeicons/react";
import type { AgentView } from "@near-intents-agent-api/sdk";
import Link from "next/link";
import { MonoId } from "@/components/shared/identifiers";
import { StatusPill } from "@/components/shared/status";
import { accountDate } from "@/lib/format/date";
import type { AgentState } from "../model/agent-state";
import { AgentAvatar } from "./agent-avatar";

export function AgentListRow({ agent, state }: { agent: AgentView; state: AgentState }) {
  const tone =
    state.stage === "ready"
      ? "ok"
      : state.stage === "archived" || state.stage === "abandoned"
        ? "blocked"
        : "attention";
  const action = state.next.id === "none" ? "Open" : state.next.label;
  return (
    <li className="relative grid min-w-0 grid-cols-2 items-center gap-x-4 gap-y-4 rounded-[8px] border bg-card px-4 py-4 transition-colors hover:border-primary/40 md:grid-cols-[minmax(0,2fr)_minmax(0,1.15fr)_minmax(0,1fr)_minmax(0,1fr)_2rem] md:px-5">
      <div className="col-span-2 flex min-w-0 items-center gap-3 md:col-span-1">
        <AgentAvatar name={agent.name} />
        <div className="flex min-w-0 flex-col gap-1">
          <Link
            href={`/agents/${agent.id}`}
            aria-label={`${action}: ${agent.name}`}
            className="truncate text-sm font-medium after:absolute after:inset-0 after:rounded-[8px] focus-visible:outline-none focus-visible:after:ring-2 focus-visible:after:ring-ring"
          >
            {agent.name}
          </Link>
          <MonoId
            value={agent.id}
            head={8}
            tail={4}
            className="relative z-10 max-w-full text-xs"
            label="Copy account ID"
          />
        </div>
      </div>
      <div className="min-w-0 space-y-1" title={state.detail}>
        <p className="text-xs text-muted-foreground md:sr-only">Status</p>
        <StatusPill tone={tone}>{state.label}</StatusPill>
        <p className="sr-only">{state.detail}</p>
      </div>
      <div className="min-w-0 space-y-1">
        <p className="text-xs text-muted-foreground md:sr-only">Owner</p>
        <p className="text-sm">{agent.owner?.type ?? "Not bound"}</p>
      </div>
      <div className="min-w-0 space-y-1">
        <p className="text-xs text-muted-foreground md:sr-only">Created</p>
        <p className="text-sm">{accountDate(agent.created_at)}</p>
      </div>
      <span className="flex items-center justify-end text-primary" aria-hidden="true">
        <HugeiconsIcon icon={ArrowRight01Icon} className="size-6 shrink-0" />
      </span>
    </li>
  );
}
