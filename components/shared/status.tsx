import { cn } from "@/lib/utils";

/**
 * Status vocabulary for the whole demo.
 *
 * Every claim the dashboard makes about an agent — is it owned, does it have custody, is the
 * rules applied — is one of four tones, and the tone is decided in one place. A visitor
 * learns the colour language on the first screen and it holds on every screen after it.
 *
 * `ok` means the thing is true. `attention` means a human still has to act. `blocked` means
 * the thing was refused or removed and no amount of waiting helps. `neutral` means the state
 * is legitimately absent rather than wrong: an unbound agent is not broken.
 */
export type StatusTone = "ok" | "attention" | "blocked" | "neutral";

const TONE_CLASS: Record<StatusTone, string> = {
  ok: "text-success",
  attention: "text-warning",
  blocked: "text-destructive",
  neutral: "text-muted-foreground",
};

export function StatusPill({
  tone,
  children,
  className,
}: {
  tone: StatusTone;
  children: React.ReactNode;
  className?: string;
}) {
  return (
    <span
      className={cn(
        "inline-flex items-center gap-1.5 text-xs font-medium",
        TONE_CLASS[tone],
        className,
      )}
    >
      <span aria-hidden="true" className="size-1.5 shrink-0 rounded-sm bg-current" />
      {children}
    </span>
  );
}
