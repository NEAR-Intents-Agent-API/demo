"use client";

import type { Policy } from "@near-intents-agent-api/sdk";
import { Pending, Unavailable } from "@/components/shared/states";
import { Button } from "@/components/ui/button";
import type { IntentStep } from "@/features/intents";
import { rulesFromPolicy } from "@/features/policy/model";
import { errorMessage } from "@/lib/http/messages";
import { RulesOverview } from "../../agent-list/components/create-agent/rules-overview";
import type { useOnboarding } from "../hooks/use-onboarding";
import { type OnboardingState, onboardingState } from "../onboarding-state";

function RequestRules({ policy, expired }: { policy: Policy; expired: boolean }) {
  return (
    <div className="w-full">
      <p className="mb-2 text-sm font-medium">
        {expired ? "Rules of the expired request" : "Rules your signature installs"}
      </p>
      <RulesOverview rules={rulesFromPolicy(policy)} />
    </div>
  );
}

function actionLabel(state: OnboardingState) {
  if (state === "expired") return "Start a fresh request";
  return state === "sign" ? "Sign to activate" : "Check status";
}

function stateMessage(state: OnboardingState, expiresAt: string) {
  switch (state) {
    case "sign":
      return `Waiting for your signature until ${new Date(expiresAt).toLocaleString()}.`;
    case "expired":
      return "This activation request expired before it went live. It can no longer be signed. A fresh request creates a new account with the same name and rules.";
    case "review":
      return "Your signature was submitted, but the outcome is not confirmed yet. It will not be signed again.";
    default:
      return "Your signature was submitted. Waiting for the chain to confirm it.";
  }
}

export function OnboardingPanel({ view }: { view: ReturnType<typeof useOnboarding> }) {
  const { onboarding } = view;
  if (onboarding.isPending) return <Pending />;
  if (onboarding.error)
    return (
      <Unavailable code={onboarding.error.message} onRetry={() => void onboarding.refetch()} />
    );
  return <OnboardingBody view={view} step={onboarding.data} />;
}

function OnboardingBody({
  view,
  step,
}: {
  view: ReturnType<typeof useOnboarding>;
  step: IntentStep;
}) {
  const { finish, restart, stage } = view;
  const { generated } = step;
  const state = onboardingState(step);
  const working = finish.isPending || restart.isPending;
  const error = restart.error ?? finish.error;
  const rules = generated.preview.policy;
  const expired = state === "expired";
  const mutation = expired ? restart : finish;
  const label = actionLabel(state);
  return (
    <div className="flex flex-col items-start gap-4">
      {rules && (state === "sign" || expired) ? (
        <RequestRules policy={rules} expired={expired} />
      ) : null}
      <p className="text-sm text-muted-foreground">{stateMessage(state, generated.expires_at)}</p>
      {state === "done" ? null : (
        <Button disabled={working} onClick={() => mutation.mutate()}>
          {mutation.isPending ? <Pending /> : null}
          {mutation.isPending ? stage || "Working…" : label}
        </Button>
      )}
      {error ? (
        <p role="alert" className="text-sm text-destructive">
          {errorMessage(error.message)}
        </p>
      ) : null}
    </div>
  );
}
