"use client";

import { ArrowRight01Icon } from "@hugeicons/core-free-icons";
import { HugeiconsIcon } from "@hugeicons/react";
import { useContext } from "react";
import { Button } from "@/components/ui/button";
import { FlowFooter } from "../flows/flow-footer";
import { FlowFooterContext } from "../flows/flow-footer-context";

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
  return (
    <>
      {setupFooter ? (
        <div className="flex flex-wrap items-center gap-2">
          {status === "NEEDS_REVIEW" ? (
            <Button variant="link" disabled={pending} onClick={onRefresh}>
              Check after review
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
          {status === "NEEDS_REVIEW" ? (
            <Button variant="outline" disabled={pending} onClick={onRefresh}>
              Check after review
            </Button>
          ) : null}
          <Button onClick={onDone} variant={settled ? "default" : "outline"}>
            {settled ? "Done" : status === "NEEDS_REVIEW" ? "Close" : "Start another"}
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
