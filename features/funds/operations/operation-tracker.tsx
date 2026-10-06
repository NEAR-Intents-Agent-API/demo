"use client";

import { PhaseBar } from "./operation-phase-bar";
import { describeOperation, TERMINAL_STATUSES } from "./operation-status";
import { StatusBadge } from "./operation-status-badge";
import { OperationTrackerActions } from "./operation-tracker-actions";
import { OperationTrackerFacts } from "./operation-tracker-facts";
import { useOperation } from "./use-operation";

/**
 * Follows one operation from "submitted" to a final answer.
 *
 * It polls the operation itself rather than trusting the response to the click, because for
 * cross-chain moves the click only proves the request was accepted. A terminal state stops the
 * polling; an uncertain one keeps going, since uncertain is a question, not an answer.
 */
export function OperationTracker({
  agentId,
  operationId,
  initialStatus,
  title,
  onDone,
  onOpenActivity,
  children,
}: {
  agentId: string;
  operationId: string;
  initialStatus: string;
  title: string;
  onDone: () => void;
  onOpenActivity?: () => void;
  /** Flow-specific detail shown under the title, e.g. where to send a deposit. */
  children?: React.ReactNode;
}) {
  const { operation, refresh } = useOperation(agentId, operationId);
  const status = operation.data?.status ?? initialStatus;
  const view = describeOperation(status);
  const settled = TERMINAL_STATUSES.has(status);
  const details = (operation.data?.details ?? {}) as Record<string, unknown>;

  return (
    <div className="flex flex-col gap-5">
      <div className="flex items-start gap-3">
        <StatusBadge tone={view.tone} />
        <div className="min-w-0">
          <p className="text-base font-medium">{title}</p>
          <p className="mt-0.5 text-sm text-muted-foreground">{view.line}</p>
        </div>
      </div>

      {children}
      {status === "NEEDS_REVIEW" && typeof details.reason === "string" ? (
        <p className="text-sm break-words text-muted-foreground">{details.reason}</p>
      ) : null}
      {refresh.isError ? (
        <p role="alert" className="text-sm text-destructive">
          Status check failed. Check again later.
        </p>
      ) : null}

      <PhaseBar reached={view.reached} tone={view.tone} settled={settled} />

      <OperationTrackerFacts
        status={status}
        operationId={operationId}
        details={details}
        failureCode={operation.data?.failure_code}
      />

      <OperationTrackerActions
        status={status}
        settled={settled}
        pending={refresh.isPending}
        onRefresh={() => refresh.mutate()}
        onDone={onDone}
        onOpenActivity={onOpenActivity}
      />
    </div>
  );
}
