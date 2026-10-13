import type { ApprovalView } from "@near-intents-agent-api/sdk";
import { request } from "@/lib/http/request";

/** One approval whatever its outcome; the list endpoint only reports requests still waiting. */
export const readApproval = (agentId: string, approvalId: string) =>
  request<ApprovalView>(`/api/agents/${agentId}/approvals/${encodeURIComponent(approvalId)}`);

const HISTORY_SIZE = 10;
const storageKey = (agentId: string) => `approvals-seen:${agentId}`;

/** Approval ids this browser session has seen waiting, newest first. */
export function readSeenApprovals(agentId: string): string[] {
  try {
    const stored: unknown = JSON.parse(sessionStorage.getItem(storageKey(agentId)) ?? "[]");
    return Array.isArray(stored)
      ? stored.filter((id): id is string => typeof id === "string").slice(0, HISTORY_SIZE)
      : [];
  } catch {
    return [];
  }
}

export function writeSeenApprovals(agentId: string, ids: readonly string[]): void {
  try {
    sessionStorage.setItem(storageKey(agentId), JSON.stringify(ids));
  } catch {
    // Storage can be blocked; the decisions then stay visible only until the page reloads.
  }
}

/**
 * Newly waiting requests go to the front of the remembered ids. The provider drops a request
 * from its waiting list once it is approved, rejected or expired, so the ids seen while it was
 * waiting are how its outcome is found again.
 */
export function rememberApprovals(seen: readonly string[], waiting: readonly string[]): string[] {
  const fresh = waiting.filter((id) => !seen.includes(id));
  return fresh.length ? [...fresh, ...seen].slice(0, HISTORY_SIZE) : [...seen];
}

/** Settled requests, most recently seen first. */
export function decidedApprovals(views: readonly (ApprovalView | undefined)[]): ApprovalView[] {
  return views.filter((view): view is ApprovalView => Boolean(view && view.status !== "PENDING"));
}
