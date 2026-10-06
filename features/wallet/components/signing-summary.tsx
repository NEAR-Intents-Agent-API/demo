"use client";

import { ArrowDown01Icon } from "@hugeicons/core-free-icons";
import { HugeiconsIcon } from "@hugeicons/react";
import type { OwnerWallet } from "@near-intents-agent-api/sdk";
import { Collapsible, CollapsibleContent, CollapsibleTrigger } from "@/components/ui/collapsible";
import { cn } from "@/lib/utils";
import { type SummaryRow, summarizeSignedMessage } from "../model/message-summary";

/**
 * What one signature authorizes, shown twice on purpose.
 *
 * The envelope arrives as canonical JSON: exactly the right thing to sign, and a terrible thing
 * to read. So it is decoded into facts at the top, and the untouched message stays one click
 * below — that text is the thing being signed, and the signer is entitled to see it. Nothing is
 * paraphrased away: an envelope the decoder does not recognise renders as bytes only.
 */
export function SigningSummary({ owner, message }: { owner: OwnerWallet; message: string }) {
  const summary = summarizeSignedMessage(message);

  return (
    <div className="flex min-w-0 flex-col gap-4">
      <div className="flex flex-wrap items-center justify-between gap-2">
        <span className="flex items-center gap-2 text-xs text-muted-foreground">
          Signed with
          <span className="font-medium text-foreground">{owner.type}</span>
        </span>
        {summary ? <span className="console-eyebrow">{summary.kind}</span> : null}
      </div>

      {summary ? (
        <div className="flex flex-col gap-4">
          <p className="text-sm font-medium">{summary.title}</p>
          <FactTable rows={summary.rows} />
          {summary.details.length > 0 ? (
            <div className="flex flex-col gap-2">
              <p className="console-eyebrow">What this installs</p>
              <FactTable rows={summary.details} />
            </div>
          ) : null}
        </div>
      ) : (
        <p className="text-sm text-muted-foreground">
          This envelope is not one the summary recognises, so it is shown exactly as it will be
          signed.
        </p>
      )}

      <Collapsible defaultOpen={summary === null} className="group/bytes">
        <CollapsibleTrigger className="flex items-center gap-1.5 text-xs text-muted-foreground transition-colors hover:text-foreground">
          <HugeiconsIcon
            icon={ArrowDown01Icon}
            className="size-3.5 transition-transform group-data-[panel-open]/bytes:rotate-180"
          />
          {summary ? "Show the exact signed bytes" : "Signed message"}
        </CollapsibleTrigger>
        <CollapsibleContent>
          <pre
            data-testid="signing-message"
            className="mt-2 max-h-60 w-full max-w-full min-w-0 overflow-x-hidden overflow-y-auto rounded-xl border bg-muted/40 p-3 text-xs leading-relaxed break-all whitespace-pre-wrap"
          >
            {message}
          </pre>
        </CollapsibleContent>
      </Collapsible>
    </div>
  );
}

function FactTable({ rows }: { rows: SummaryRow[] }) {
  return (
    <dl className="flex flex-col gap-2">
      {rows.map((row) => (
        <div
          key={row.label}
          className="flex flex-col gap-1 py-1 sm:flex-row sm:items-baseline sm:gap-3"
        >
          <dt className="sm:w-40 shrink-0 text-xs text-muted-foreground">{row.label}</dt>
          <dd
            className={cn(
              "min-w-0 flex-1 break-words text-xs",
              row.mono && "console-id",
              row.emphasis ? "font-medium text-foreground" : "text-foreground/90",
            )}
            title={row.value}
          >
            {/* Long identifiers are elided here; the full value stays in the title and in the
                exact message below, which is the text actually being signed. */}
            {row.value}
          </dd>
        </div>
      ))}
    </dl>
  );
}
