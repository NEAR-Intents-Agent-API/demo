"use client";
import { Disclosure } from "@/components/shared/disclosure";
import { labelFor, quoteEntries } from "../model/quote";

export function QuoteDetails({ quote }: { quote: Record<string, unknown> | null }) {
  const entries = quoteEntries(quote);
  if (entries.length === 0) return null;
  return (
    <Disclosure summary="Provider quote">
      <dl className="mt-3 flex flex-col gap-2 text-xs">
        {entries.map(([key, value]) => (
          <div key={key} className="flex flex-wrap justify-between gap-3">
            <dt className="text-muted-foreground">{labelFor(key)}</dt>
            <dd className="console-id max-w-full break-all text-right">{value}</dd>
          </div>
        ))}
      </dl>
    </Disclosure>
  );
}
