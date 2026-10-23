"use client";

import { Callout } from "@/components/shared/callout";
import type { QuoteWarning } from "../model/quote";
import { warningMessage } from "../model/quote-warnings";

/**
 * What a dry run says the live request would be refused for. A preview never refuses for rules or
 * balance, so these are the only place the owner sees the problem before pressing the button.
 */
export function QuoteWarnings({
  warnings,
  token,
}: {
  warnings: readonly QuoteWarning[];
  token: { symbol: string; decimals: number | null } | null;
}) {
  if (warnings.length === 0) return null;
  return (
    <Callout tone="warning" compact>
      <ul className="flex flex-col gap-1">
        {warnings.map((warning) => (
          <li key={warning.code}>{warningMessage(warning, token)}</li>
        ))}
      </ul>
    </Callout>
  );
}
