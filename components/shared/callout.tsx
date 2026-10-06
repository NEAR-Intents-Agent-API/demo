import {
  Alert02Icon,
  AlertCircleIcon,
  CheckmarkCircle02Icon,
  InformationCircleIcon,
} from "@hugeicons/core-free-icons";
import { HugeiconsIcon } from "@hugeicons/react";
import { cn } from "@/lib/utils";

type Icon = Parameters<typeof HugeiconsIcon>[0]["icon"];

/**
 * One inline message tone for the whole app. Callouts answer "what does this mean for me?":
 *
 * - `info` — context that helps you decide; nothing is wrong.
 * - `success` — something completed or is confirmed.
 * - `warning` — a human still has to act, or a limit is close.
 * - `danger` — refused, frozen or failed; waiting will not change it.
 */
export type CalloutTone = "info" | "success" | "warning" | "danger";

const TONE: Record<CalloutTone, { icon: Icon; shell: string; accent: string }> = {
  info: {
    icon: InformationCircleIcon,
    shell: "border-info/25 bg-info-muted/60",
    accent: "text-info",
  },
  success: {
    icon: CheckmarkCircle02Icon,
    shell: "border-success/25 bg-success-muted/60",
    accent: "text-success",
  },
  warning: {
    icon: Alert02Icon,
    shell: "border-warning/30 bg-warning-muted/60",
    accent: "text-warning",
  },
  danger: {
    icon: AlertCircleIcon,
    shell: "border-destructive/25 bg-destructive/5",
    accent: "text-destructive",
  },
};

export function Callout({
  tone = "info",
  title,
  children,
  action,
  className,
  compact = false,
}: {
  tone?: CalloutTone;
  title?: string;
  children: React.ReactNode;
  action?: React.ReactNode;
  className?: string;
  /** Denser padding and type for callouts inside a control or a list row. */
  compact?: boolean;
}) {
  const { icon: Icon, shell, accent } = TONE[tone];
  return (
    <div
      className={cn(
        "flex items-start gap-3 rounded-lg border",
        compact ? "px-3.5 py-2.5" : "px-4 py-3.5",
        shell,
        className,
      )}
    >
      <HugeiconsIcon
        icon={Icon}
        className={cn("mt-0.5 size-4 shrink-0", accent)}
        aria-hidden="true"
      />
      <div className="flex min-w-0 flex-1 flex-col gap-0.5">
        {title ? <p className="text-sm font-medium">{title}</p> : null}
        <div
          className={cn(
            "leading-5 text-muted-foreground",
            compact ? "text-xs" : "text-sm",
            tone === "danger" && "text-foreground",
          )}
        >
          {children}
        </div>
      </div>
      {action ? <div className="shrink-0 self-center">{action}</div> : null}
    </div>
  );
}
