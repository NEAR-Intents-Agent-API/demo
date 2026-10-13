"use client";
import { SecurityLockIcon } from "@hugeicons/core-free-icons";
import { HugeiconsIcon } from "@hugeicons/react";
import { Choice } from "@/components/shared/choice";
import type { SetupNavigation } from "@/components/shared/setup-navigation-context";
import { SetupStepFooter } from "@/components/shared/setup-step-footer";
import { Pending } from "@/components/shared/states";
import { Button } from "@/components/ui/button";
import { Field, FieldDescription, FieldError, FieldLabel } from "@/components/ui/field";
import { Input } from "@/components/ui/input";
import { GrantRules } from "@/features/policy";
import { GRANT_LABEL_MAX, GRANT_MAX_DAYS } from "@/lib/agent-api/access-input";
import type { AccessGrantView as Access } from "../api";
import { ACCESS_DURATIONS, type AccessDuration, localDateTimeValue } from "./access-form-utils";
import { type AccessRequest, useAccessForm } from "./use-access-form";

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
  onSubmit: (request: AccessRequest) => void;
  navigation?: SetupNavigation;
}) {
  const form = useAccessForm();
  const submit = () => {
    const request = form.request();
    if (request) onSubmit(request);
  };

  const action = (
    <Button size="lg" className="w-full" disabled={busy} onClick={submit}>
      {busy ? <Pending /> : <HugeiconsIcon icon={SecurityLockIcon} className="size-4" />}
      {busy ? "Preparing…" : "Review and sign"}
    </Button>
  );

  return (
    <div className="flex flex-col gap-5">
      <GrantRules agentId={agentId} holder="the dashboard" />

      <div className="flex flex-col gap-4 border-t pt-5">
        <Field data-invalid={Boolean(form.problems?.label)}>
          <FieldLabel htmlFor="access-label">Name</FieldLabel>
          <Input
            id="access-label"
            value={form.label}
            onChange={(event) => form.setLabel(event.target.value)}
            disabled={busy}
            spellCheck={false}
            autoComplete="off"
            aria-invalid={Boolean(form.problems?.label)}
            placeholder="Dashboard"
          />
          <FieldDescription>
            Shown when you sign and wherever this access is listed. Up to {GRANT_LABEL_MAX}{" "}
            characters.
          </FieldDescription>
          <FieldError>{form.problems?.label}</FieldError>
        </Field>

        <div className="flex flex-col gap-3">
          <div className="space-y-1">
            <p className="text-sm font-medium">Access duration</p>
            <p className="text-xs leading-5 text-muted-foreground">
              Access expires after this period; at most {GRANT_MAX_DAYS} days.
            </p>
          </div>
          <Choice<AccessDuration>
            label="Duration"
            value={form.duration}
            onChange={form.setDuration}
            disabled={busy}
            className="w-full"
            options={ACCESS_DURATIONS}
          />
          {form.duration === "custom" ? (
            <Field data-invalid={Boolean(form.problems?.expiry)}>
              <FieldLabel htmlFor="access-expiry">Expires on</FieldLabel>
              <Input
                id="access-expiry"
                type="datetime-local"
                value={form.custom}
                min={localDateTimeValue(Date.now())}
                max={localDateTimeValue(Date.now() + GRANT_MAX_DAYS * 24 * 60 * 60 * 1000)}
                onChange={(event) => form.setCustom(event.target.value)}
                disabled={busy}
                aria-invalid={Boolean(form.problems?.expiry)}
              />
            </Field>
          ) : null}
          {form.duration === "custom" ? null : (
            <p className="text-xs leading-5 text-muted-foreground">
              Ends {ACCESS_DURATIONS.find((option) => option.value === form.duration)?.label} after
              you sign. You see the exact date and time before signing.
            </p>
          )}
          {form.problems?.expiry ? (
            <p role="alert" className="text-sm text-destructive">
              {form.problems.expiry}
            </p>
          ) : null}
        </div>
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
