"use client";

import { Alert02Icon, Loading03Icon } from "@hugeicons/core-free-icons";
import { HugeiconsIcon } from "@hugeicons/react";
import { Button } from "@/components/ui/button";
import { Skeleton } from "@/components/ui/skeleton";
import { errorMessage, errorMessages, isRetryable } from "@/lib/http/messages";
import { cn } from "@/lib/utils";

/**
 * The three ways a read can fail to produce content, kept visually distinct because they mean
 * different things to a visitor:
 *
 * - `Loading` — we do not know yet. Never rendered as an empty list or a zero.
 * - `Unavailable` — the provider refused or is unreachable. Shows known API codes only.
 * - `Empty` — the read succeeded and there is genuinely nothing. Says what to do about it.
 */

export function Loading({ rows = 3, className }: { rows?: number; className?: string }) {
  const skeletons = ["skeleton-a", "skeleton-b", "skeleton-c", "skeleton-d", "skeleton-e"];
  return (
    <div className={cn("flex flex-col gap-2", className)} aria-busy="true">
      {skeletons.slice(0, rows).map((key) => (
        <Skeleton key={key} className="h-11 w-full rounded-lg" />
      ))}
    </div>
  );
}

export function Unavailable({
  code,
  onRetry,
  className,
}: {
  code: string;
  onRetry?: () => void;
  className?: string;
}) {
  const message = errorMessage(code);
  const showCode = Object.hasOwn(errorMessages, code);
  // State errors cannot be fixed by repeating the request, so they get no retry control.
  const retry = onRetry && isRetryable(code) ? onRetry : undefined;
  return (
    <div
      className={cn(
        "flex flex-wrap items-center gap-3 rounded-xl border border-destructive/25 bg-destructive/5 px-4 py-3",
        className,
      )}
      role="status"
    >
      <HugeiconsIcon icon={Alert02Icon} className="size-4 shrink-0 text-destructive" />
      <span className="text-sm text-foreground">{message}</span>
      {showCode ? <span className="console-id ml-auto text-muted-foreground">{code}</span> : null}
      {retry ? (
        <Button variant="outline" size="sm" onClick={retry}>
          Try again
        </Button>
      ) : null}
    </div>
  );
}

export function Empty({
  title,
  detail,
  action,
  className,
}: {
  title: string;
  detail: string;
  action?: React.ReactNode;
  className?: string;
}) {
  return (
    <div
      className={cn(
        "flex flex-col items-center gap-2 rounded-xl border border-dashed px-6 py-10 text-center",
        className,
      )}
    >
      <p className="text-sm font-medium">{title}</p>
      <p className="max-w-md text-xs leading-5 text-muted-foreground">{detail}</p>
      {action ? <div className="mt-2">{action}</div> : null}
    </div>
  );
}

/** Inline spinner for a control that is already showing its own label. */
export function Pending({ className }: { className?: string }) {
  return <HugeiconsIcon icon={Loading03Icon} className={cn("size-4 animate-spin", className)} />;
}
