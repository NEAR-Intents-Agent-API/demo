"use client";

import { Loading, Unavailable } from "@/components/shared/states";
import { ConsentDialog } from "../components/consent-dialog";
import { ApprovalRow } from "./approval-row";
import { ApprovalSummary } from "./approval-summary";
import { useApprovals } from "./use-approvals";

/**
 * Requests the provider is holding for your decision — the only rows in the whole dashboard
 * that ask for a signature to keep something moving. Approving releases it to execute; rejecting
 * ends it. The exact payload is always available behind the disclosure.
 */
export function ApprovalsPanel({ agentId }: { agentId: string }) {
  const view = useApprovals(agentId);

  return (
    <>
      <section className="overflow-hidden rounded-lg border bg-card">
        <header className="flex flex-wrap items-center justify-between gap-x-4 gap-y-2 px-4 py-4 sm:px-5">
          <h3 className="console-heading">Approvals</h3>
          <ApprovalSummary
            count={view.entries.length}
            loading={view.approvals.isPending}
            failed={Boolean(view.approvals.error)}
          />
        </header>
        <div>
          {view.approvals.isPending ? (
            <Loading rows={1} className="p-4 sm:p-5" />
          ) : view.approvals.error ? (
            <Unavailable
              code={view.approvals.error.message}
              onRetry={() => void view.approvals.refetch()}
              className="m-4 sm:m-5"
            />
          ) : view.entries.length > 0 ? (
            <ul className="divide-y border-t">
              {view.entries.map((approval) => (
                <ApprovalRow
                  key={approval.approval_id}
                  approval={approval}
                  pending={view.prepare.isPending}
                  onDecide={(verdict) =>
                    view.prepare.mutate({ approvalId: approval.approval_id, verdict })
                  }
                />
              ))}
            </ul>
          ) : null}
        </div>
        {view.error && !view.decision ? (
          <p className="px-4 pb-4 text-sm text-destructive sm:px-5">{view.error}</p>
        ) : null}
      </section>

      <ConsentDialog
        open={view.decision !== null}
        onOpenChange={(open) => {
          if (!open) view.setDecision(null);
        }}
        title={view.decision?.verdict === "reject" ? "Sign the rejection" : "Sign the approval"}
        description="The provider will act on exactly this signed payload."
        challenge={view.decision?.consent ?? null}
        stage={view.stage}
        error={view.error}
        confirmLabel={view.decision?.verdict === "reject" ? "Sign rejection" : "Sign approval"}
        onSign={view.signAndVote}
      />
    </>
  );
}
