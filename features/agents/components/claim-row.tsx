import { StatusPill } from "@/components/shared/status";

/**
 * One authority as a numbered claim with the question it answers. The number is what ties this
 * card to the three-step rail elsewhere; the question is what makes it legible without jargon.
 */
export function ClaimRow({
  index,
  label,
  question,
  tone,
  status,
  value,
}: {
  index: number;
  label: string;
  question: string;
  tone: "ok" | "neutral";
  status: string;
  value: string;
}) {
  return (
    <div className="flex flex-col gap-2 py-4 sm:flex-row sm:items-start sm:gap-5">
      <span className="console-id w-4 shrink-0 text-xs text-muted-foreground">{index}</span>
      <div className="flex min-w-0 flex-1 flex-col gap-2">
        <div className="flex flex-wrap items-center gap-2">
          <span className="text-sm font-medium">{label}</span>
          <StatusPill tone={tone}>{status}</StatusPill>
        </div>
        <p className="text-xs text-muted-foreground">{question}</p>
        <p className="console-id max-w-full break-all text-foreground" title={value}>
          {value}
        </p>
      </div>
    </div>
  );
}
