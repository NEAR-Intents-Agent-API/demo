"use client";

import { ArrowRight01Icon } from "@hugeicons/core-free-icons";
import { HugeiconsIcon } from "@hugeicons/react";
import { useContext } from "react";
import { Button } from "@/components/ui/button";
import { FlowFooter } from "../flows/flow-footer";
import { FlowFooterContext } from "../flows/flow-footer-context";
import { UNRESOLVED_STATUSES } from "./operation-status";

export function OperationTrackerActions({
  status,
  settled,
  pending,
  onRefresh,
  onDone,
  onOpenActivity,
}: {
  status: string;
  settled: boolean;
  pending: boolean;
  onRefresh: () => void;
  onDone: () => void;
  onOpenActivity?: () => void;
}) {
  const setupFooter = useContext(FlowFooterContext) === false;
  // An unresolved move may still land: checking again is safe, starting another is not.
  const unresolved = UNRESOLVED_STATUSES.has(status);
  const checkLabel = status === "NEEDS_REVIEW" ? "Check after review" : "Check again";
  return (
    <>
      {setupFooter ? (
        <div className="flex flex-wrap items-center gap-2">
          {unresolved ? (
            <Button variant="link" disabled={pending} onClick={onRefresh}>
              {checkLabel}
            </Button>
          ) : null}
          {onOpenActivity ? (
            <Button variant="link" onClick={onOpenActivity}>
              Open activity
              <HugeiconsIcon icon={ArrowRight01Icon} className="size-4" />
            </Button>
          ) : null}
        </div>
      ) : null}
      <FlowFooter>
        <div className="flex flex-wrap items-center justify-end gap-2">
          {unresolved ? (
            <Button variant="outline" disabled={pending} onClick={onRefresh}>
              {checkLabel}
            </Button>
          ) : null}
          <Button onClick={onDone} variant={settled ? "default" : "outline"}>
            {settled ? "Done" : unresolved ? "Close" : "Start another"}
          </Button>
          {onOpenActivity ? (
            <Button variant="link" onClick={onOpenActivity}>
              Open activity
              <HugeiconsIcon icon={ArrowRight01Icon} className="size-4" />
            </Button>
          ) : null}
        </div>
      </FlowFooter>
    </>
  );
}
