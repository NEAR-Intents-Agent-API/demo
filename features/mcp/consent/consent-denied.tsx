import { Alert02Icon } from "@hugeicons/core-free-icons";
import { HugeiconsIcon } from "@hugeicons/react";

/**
 * Terminal state for an authorization request the demo refuses outright, such as a resource
 * that is not one of this user's agents. It states the refusal and the reason, and offers no
 * way to retry — a different request is the fix, not a second attempt.
 */
export function ConsentDenied({ title, detail }: { title: string; detail: string }) {
  return (
    <main className="console-shell flex min-h-svh items-center justify-center p-6">
      <div className="console-panel w-full max-w-md rounded-lg p-8 text-center">
        <span className="mx-auto flex justify-center text-destructive">
          <HugeiconsIcon icon={Alert02Icon} className="size-5 text-destructive" />
        </span>
        <h1 className="console-title mt-5 text-xl">{title}</h1>
        <p className="mt-2 text-sm leading-6 text-muted-foreground">{detail}</p>
        <p className="mt-5 text-xs leading-5 text-muted-foreground">
          No credential was issued and nothing was changed. A client reaches exactly one account,
          and only one that belongs to the account that signed in.
        </p>
      </div>
    </main>
  );
}
