"use client";

import { useMemo } from "react";

/** One idempotency key per distinct request: same inputs retry safely, changed inputs get a new key. */
export function useIdempotencyKey(fingerprint: string): string {
  // biome-ignore lint/correctness/useExhaustiveDependencies: the fingerprint is the dependency by design
  return useMemo(() => crypto.randomUUID(), [fingerprint]);
}
