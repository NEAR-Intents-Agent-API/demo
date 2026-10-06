"use client";

import { errorMessage } from "@/lib/http/messages";

export function FlowError({ code }: { code: string | null | undefined }) {
  if (!code) return null;
  return (
    <p
      role="alert"
      className="rounded-lg border border-destructive/25 bg-destructive/5 px-4 py-3 text-sm text-destructive"
    >
      {errorMessage(code)}
    </p>
  );
}
