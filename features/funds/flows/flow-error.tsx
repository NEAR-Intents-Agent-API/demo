"use client";

import { errorMessage } from "@/lib/http/messages";

/** Pass the error itself, not its message: its details add the USD left and the retry time. */
export function FlowError({ error }: { error: unknown }) {
  if (!error) return null;
  return (
    <p
      role="alert"
      className="rounded-lg border border-destructive/25 bg-destructive/5 px-4 py-3 text-sm text-destructive"
    >
      {errorMessage(error)}
    </p>
  );
}
