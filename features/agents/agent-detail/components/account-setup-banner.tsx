"use client";

import { Alert02Icon, ArrowRight01Icon } from "@hugeicons/core-free-icons";
import { HugeiconsIcon } from "@hugeicons/react";
import { Loading, Unavailable } from "@/components/shared/states";
import { Button } from "@/components/ui/button";
import type { useWalletSetup } from "../hooks/use-wallet-setup";
import { nextSetupStep } from "./setup-progress-utils";

export function AccountSetupBanner({
  setup,
  busy,
}: {
  setup: ReturnType<typeof useWalletSetup>;
  busy: boolean;
}) {
  if (!setup.settled) return <Loading rows={1} />;
  if (setup.error)
    return <Unavailable code={setup.error.message} onRetry={() => void setup.refresh()} />;
  const missing = setup.steps.filter((step) => !step.done && !step.optional);
  const next = nextSetupStep(setup.steps);
  if (!next) return null;
  return (
    <section
      aria-label="Incomplete account setup"
      className="flex h-[50px] w-full min-w-0 items-center gap-3 rounded-lg border-[0.5px] border-primary/60 bg-card px-3"
    >
      <span
        className="flex size-7 shrink-0 items-center justify-center text-primary"
        aria-hidden="true"
      >
        <HugeiconsIcon icon={Alert02Icon} className="size-4" />
      </span>
      <div className="min-w-0 flex-1">
        <h2 className="text-xs font-medium text-primary">Setup incomplete</h2>
        <p className="sr-only">
          {missing
            .map((step) => (step.id === "fund" ? "No funds available" : "No client connected"))
            .join(" · ")}
        </p>
      </div>
      <Button
        variant="link"
        size="xs"
        className="gap-1.5 px-0 text-primary"
        disabled={busy}
        onClick={next.onClick}
      >
        Continue setup
        <HugeiconsIcon icon={ArrowRight01Icon} className="size-4" aria-hidden="true" />
      </Button>
    </section>
  );
}
