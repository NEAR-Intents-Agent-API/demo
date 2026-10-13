import type { ApprovalView } from "@near-intents-agent-api/sdk";
import { StatusPill, type StatusTone } from "@/components/shared/status";
import { accountTimestamp } from "@/lib/format/date";
import { humanizeRequestType } from "./approval-display-utils";

const OUTCOME: Record<
  Exclude<ApprovalView["status"], "PENDING">,
  { label: string; tone: StatusTone }
> = {
  APPROVED: { label: "Approved", tone: "ok" },
  REJECTED: { label: "Rejected", tone: "blocked" },
  EXPIRED: { label: "Expired, nothing ran", tone: "neutral" },
};

/** Requests that left the waiting list, so an answer or a lapse never just disappears. */
export function ApprovalHistoryList({ approvals }: { approvals: readonly ApprovalView[] }) {
  return (
    <div className="border-t">
      <h4 className="px-4 pt-4 text-xs font-medium text-muted-foreground sm:px-5">
        Recent decisions
      </h4>
      <ul className="divide-y">
        {approvals.map((approval) => {
          const outcome = OUTCOME[approval.status as keyof typeof OUTCOME] ?? OUTCOME.EXPIRED;
          return (
            <li
              key={approval.approval_id}
              className="flex flex-wrap items-center justify-between gap-2 px-4 py-3 text-sm sm:px-5"
              data-testid="decided-approval"
            >
              <span className="capitalize">{humanizeRequestType(approval.request_type)}</span>
              <span className="flex items-center gap-3">
                <StatusPill tone={outcome.tone}>{outcome.label}</StatusPill>
                {approval.status === "EXPIRED" && approval.expires_at ? (
                  <span className="text-xs text-muted-foreground">
                    {accountTimestamp(approval.expires_at)}
                  </span>
                ) : null}
              </span>
            </li>
          );
        })}
      </ul>
    </div>
  );
}
