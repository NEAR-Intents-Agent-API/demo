"use client";
import { StatusPill } from "@/components/shared/status";
import type { workspaceSummary } from "../../model/agent-state";
export function SummaryStrip({ summary }: { summary: ReturnType<typeof workspaceSummary> }) {
  const facts = [
    {
      label: "Agent accounts",
      value: String(summary.total),
      detail: summary.total === 1 ? "custody wallet" : "custody wallets",
      tone: "neutral" as const,
    },
    {
      label: "Operational",
      value: String(summary.operational),
      detail: "live with rules",
      tone: "ok" as const,
    },
    {
      label: "Waiting on you",
      value: String(summary.needsYou),
      detail: "need your signature",
      tone: summary.needsYou > 0 ? ("attention" as const) : ("neutral" as const),
    },
  ];
  return (
    <dl className="grid divide-y divide-border sm:grid-cols-3 sm:divide-x sm:divide-y-0">
      {facts.map((fact) => (
        <div
          key={fact.label}
          className="flex min-w-0 flex-col gap-3 py-5 sm:px-6 sm:first:pl-0 sm:last:pr-0"
        >
          <dt className="text-[11px] leading-4 font-medium tracking-[1px] text-muted-foreground uppercase">
            {fact.label}
          </dt>
          <dd className="flex flex-wrap items-baseline gap-x-3 gap-y-1.5">
            <div className="flex items-center gap-3">
              <span className="text-[32px] leading-10 font-medium tracking-tight tabular-nums">
                {fact.value}
              </span>
              {fact.tone === "attention" ? (
                <StatusPill tone="attention">pick up below</StatusPill>
              ) : null}
            </div>
            <span className="text-xs leading-[18px] text-muted-foreground">{fact.detail}</span>
          </dd>
        </div>
      ))}
    </dl>
  );
}
