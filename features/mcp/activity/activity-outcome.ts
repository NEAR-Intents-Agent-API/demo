import type { StatusTone } from "@/components/shared/status";
import { humanize, statusTone } from "@/features/funds";
import type { McpActivityView } from "../api";

export type ActivityOutcome = { label: string; tone: StatusTone };

/**
 * What a request amounts to now. The stored status is a snapshot from the moment of the call, so
 * a request that started an operation reports the operation's current status instead; only a
 * request whose operation is not loaded falls back to the snapshot, and says so.
 */
export function activityOutcome(
  entry: Pick<McpActivityView, "status" | "operationId">,
  operationStatuses: ReadonlyMap<string, string>,
): ActivityOutcome {
  const current = entry.operationId ? operationStatuses.get(entry.operationId) : undefined;
  if (current) return { label: humanize(current), tone: statusTone(current) };
  if (entry.status === "error") return { label: "refused or failed", tone: "blocked" };
  if (entry.status === "read") return { label: "read", tone: "neutral" };
  return {
    label: `${humanize(entry.status)} at request time`,
    tone: statusTone(entry.status),
  };
}
