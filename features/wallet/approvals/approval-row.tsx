"use client";

import { Clock01Icon, Tick02Icon } from "@hugeicons/core-free-icons";
import { HugeiconsIcon } from "@hugeicons/react";
import type { ApprovalView } from "@near-intents-agent-api/sdk";
import { Disclosure } from "@/components/shared/disclosure";
import { MonoId } from "@/components/shared/identifiers";
import { Pending } from "@/components/shared/states";
import { StatusPill } from "@/components/shared/status";
import { Button } from "@/components/ui/button";
import { accountTimestamp } from "@/lib/format/date";
import { humanizeRequestType } from "./approval-display-utils";

export function ApprovalRow({
  approval,
  pending,
  onDecide,
}: {
  approval: ApprovalView;
  pending: boolean;
  onDecide: (verdict: "approve" | "reject") => void;
}) {
  return (
    <li
      className="grid items-start gap-4 px-4 py-4 sm:px-5 lg:grid-cols-[minmax(0,1fr)_auto]"
      data-testid="pending-approval"
    >
      <div className="min-w-0 space-y-3">
        <div className="flex flex-wrap items-center gap-2">
          <StatusPill tone="attention" className="capitalize">
            {humanizeRequestType(approval.request_type)}
          </StatusPill>
          <span className="flex items-center gap-1.5 text-xs text-muted-foreground">
            <HugeiconsIcon icon={Tick02Icon} className="size-3.5" />
            {approval.required_approvals}{" "}
            {approval.required_approvals === 1 ? "signature" : "signatures"} required
          </span>
          {approval.expires_at ? (
            <span className="flex items-center gap-1.5 text-xs text-muted-foreground">
              <HugeiconsIcon icon={Clock01Icon} className="size-3.5" />
              Expires {accountTimestamp(approval.expires_at)}
            </span>
          ) : null}
        </div>

        <Disclosure summary="Request details">
          <div className="mt-3 flex flex-wrap items-center gap-2 text-xs">
            <span className="text-muted-foreground">Request</span>
            <MonoId value={approval.approval_id} head={8} tail={4} className="text-xs" />
          </div>
          <pre className="mt-2 max-h-40 overflow-auto rounded-xl border bg-muted/40 p-3 text-xs leading-relaxed">
            {JSON.stringify(approval.request_data, null, 2)}
          </pre>
        </Disclosure>
      </div>

      <div className="flex flex-wrap items-center gap-2">
        <Button size="sm" onClick={() => onDecide("approve")} disabled={pending}>
          {pending ? <Pending /> : null}
          Review and approve
        </Button>
        <Button size="sm" variant="outline" onClick={() => onDecide("reject")} disabled={pending}>
          Reject
        </Button>
      </div>
    </li>
  );
}
