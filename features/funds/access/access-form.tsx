"use client";
import { SecurityLockIcon } from "@hugeicons/core-free-icons";
import { HugeiconsIcon } from "@hugeicons/react";
import { Choice } from "@/components/shared/choice";
import type { SetupNavigation } from "@/components/shared/setup-navigation-context";
import { SetupStepFooter } from "@/components/shared/setup-step-footer";
import { Pending } from "@/components/shared/states";
import { Button } from "@/components/ui/button";
import { GrantRules } from "@/features/policy";
import type { AccessGrantView as Access } from "../api";
import { ACCESS_DURATIONS, type AccessDuration } from "./access-form-utils";
import { useAccessForm } from "./use-access-form";

export function AccessForm({
  agentId,
  current,
  busy,
  error,
  onSubmit,
  navigation,
}: {
  agentId: string;
  current: Access | null;
  busy: boolean;
  error: string | null;
  onSubmit: (days: AccessDuration) => void;
  navigation?: SetupNavigation;
}) {
  const { days, setDays } = useAccessForm();

  const action = (
    <Button size="lg" className="w-full" disabled={busy} onClick={() => onSubmit(days)}>
      {busy ? <Pending /> : <HugeiconsIcon icon={SecurityLockIcon} className="size-4" />}
      {busy ? "Preparing…" : "Review and sign"}
    </Button>
  );

  return (
    <div className="flex flex-col gap-5">
      <GrantRules agentId={agentId} holder="the dashboard" />

      <div className="flex flex-col gap-3 border-t pt-5">
        <div className="space-y-1">
          <p className="text-sm font-medium">Access duration</p>
          <p className="text-xs leading-5 text-muted-foreground">
            Dashboard access expires after this period.
          </p>
        </div>
        <Choice<AccessDuration>
          label="Duration"
          value={days}
          onChange={setDays}
          disabled={busy}
          className="w-full"
          options={ACCESS_DURATIONS}
        />
      </div>

      {current ? (
        <p className="py-1 text-xs leading-5 text-muted-foreground">
          Signing creates a new dashboard grant. Existing grants stay active until revoked or
          expired. Connected clients keep their own grants.
        </p>
      ) : null}
      {error ? (
        <p role="alert" className="text-sm text-destructive">
          {error}
        </p>
      ) : null}
      {navigation ? (
        <SetupStepFooter
          busy={busy}
          onSkip={navigation.onContinue}
          skipLabel={navigation.continueLabel}
        >
          {action}
        </SetupStepFooter>
      ) : (
        action
      )}
    </div>
  );
}
