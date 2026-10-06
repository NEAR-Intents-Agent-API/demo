import type { Status } from "@near-intents-agent-api/sdk";
import { terminalStatuses } from "@/lib/agent-api/schemas";

/**
 * Observes a server-side intent until it reaches a terminal state, the caller's `done`
 * predicate, or the deadline. One helper for onboarding, grant installation and revocation so
 * the retry cadence and cancellation semantics cannot drift between features.
 *
 * A failure code from the provider wins over the timeout; the caller's `failure` maps a value
 * to it. `AbortSignal` stops both the sleep and the next read, so leaving a screen cancels its
 * loop instead of letting it run against a dead component.
 */
export async function observeIntent<T>(input: {
  read: () => Promise<T>;
  done: (value: T) => boolean;
  failure: (value: T) => string | null | undefined;
  timeoutCode: string;
  deadlineMs?: number;
  intervalMs?: number;
  signal?: AbortSignal;
}): Promise<T> {
  const deadline = Date.now() + (input.deadlineMs ?? 120_000);
  for (;;) {
    if (input.signal?.aborted) throw new DOMException("Aborted", "AbortError");
    const value = await input.read();
    if (input.done(value)) return value;
    const failure = input.failure(value);
    if (failure) throw new Error(failure);
    if (Date.now() >= deadline) throw new Error(input.timeoutCode);
    await delay(input.intervalMs ?? 1_500, input.signal);
  }
}

/** The provider's outcome, independent of which feature is observing it. */
export function operationFailure(
  status: Status,
  failureCode: string | null | undefined,
): string | null {
  return terminalStatuses.includes(status) && status !== "SUCCESS"
    ? (failureCode ?? "operation_failed")
    : null;
}

function delay(ms: number, signal?: AbortSignal): Promise<void> {
  return new Promise((resolve, reject) => {
    if (signal?.aborted) {
      reject(new DOMException("Aborted", "AbortError"));
      return;
    }
    const timer = setTimeout(() => {
      signal?.removeEventListener("abort", onAbort);
      resolve();
    }, ms);
    const onAbort = () => {
      clearTimeout(timer);
      reject(new DOMException("Aborted", "AbortError"));
    };
    signal?.addEventListener("abort", onAbort, { once: true });
  });
}
