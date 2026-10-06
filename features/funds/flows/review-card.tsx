"use client";

import { cn } from "@/lib/utils";

/** Label/value lines for the "what will happen" card, above the confirm button. */
export function ReviewCard({
  rows,
  className,
}: {
  rows: { label: string; value: React.ReactNode; emphasis?: boolean }[];
  className?: string;
}) {
  return (
    <dl
      className={cn(
        "flex flex-col gap-1 border border-input/70 bg-muted/40 p-4 rounded-lg text-sm",
        className,
      )}
    >
      {rows.map((row) => (
        <div key={row.label} className="flex flex-wrap items-start justify-between gap-3 py-1.5">
          <dt className="text-muted-foreground">{row.label}</dt>
          <dd
            className={cn(
              "min-w-0 max-w-full break-words text-right tabular-nums",
              row.emphasis && "font-medium",
            )}
          >
            {row.value}
          </dd>
        </div>
      ))}
    </dl>
  );
}

/** The provider's own numbers, verbatim, behind a disclosure. */
export { QuoteDetails } from "./quote-details";
