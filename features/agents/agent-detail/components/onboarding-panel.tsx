"use client";

import { Pending, Unavailable } from "@/components/shared/states";
import { Button } from "@/components/ui/button";
import { errorMessage } from "@/lib/http/messages";
import type { useOnboarding } from "../hooks/use-onboarding";

export function OnboardingPanel({ view }: { view: ReturnType<typeof useOnboarding> }) {
  const { onboarding, finish, stage } = view;

  if (onboarding.isPending) return <Pending />;
  if (onboarding.error)
    return (
      <Unavailable code={onboarding.error.message} onRetry={() => void onboarding.refetch()} />
    );
  const status = onboarding.data.operation.status;
  const signable = status === "PENDING_SIGNATURE";
  return (
    <div className="flex flex-col items-start gap-3">
      <p className="text-sm text-muted-foreground">
        {signable
          ? `Waiting for your signature until ${new Date(onboarding.data.generated.expires_at).toLocaleString()}.`
          : "Your signature was submitted. Waiting for the chain to confirm it."}
      </p>
      <Button disabled={finish.isPending} onClick={() => finish.mutate()}>
        {finish.isPending ? <Pending /> : null}
        {finish.isPending ? stage || "Working…" : signable ? "Sign to activate" : "Check status"}
      </Button>
      {finish.error ? (
        <p role="alert" className="text-sm text-destructive">
          {errorMessage(finish.error.message)}
        </p>
      ) : null}
    </div>
  );
}
