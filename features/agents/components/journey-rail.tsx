"use client";
import { cn } from "@/lib/utils";
import type { AgentState } from "../model/agent-state";
export function JourneyRail({
  progress,
  stage,
}: {
  progress: { done: number; total: number };
  stage: AgentState["stage"];
}) {
  const stopped = stage === "pending";
  const steps = ["created", "live"];
  return (
    <span className="flex items-center gap-1" aria-hidden="true">
      {steps.slice(0, progress.total).map((step, index) => {
        const done = index < progress.done;
        const current = stopped && index === progress.done;
        return (
          <span
            key={step}
            className={cn(
              "size-2 rounded-full transition-colors",
              done ? "bg-foreground" : current ? "ring-2 ring-warning" : "bg-border",
            )}
          />
        );
      })}
    </span>
  );
}
