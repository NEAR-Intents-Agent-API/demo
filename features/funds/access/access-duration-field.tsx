"use client";

import { Choice } from "@/components/shared/choice";
import { Field, FieldLabel } from "@/components/ui/field";
import { Input } from "@/components/ui/input";
import { GRANT_MAX_DAYS } from "@/lib/agent-api/access-input";
import { ACCESS_DURATIONS, type AccessDuration, localDateTimeValue } from "./access-form-utils";
import type { useAccessForm } from "./use-access-form";

/** How long a grant lasts: a preset or a custom date, checked by `useAccessForm`. */
export function AccessDurationField({
  form,
  busy,
}: {
  form: ReturnType<typeof useAccessForm>;
  busy: boolean;
}) {
  return (
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
          Ends {ACCESS_DURATIONS.find((option) => option.value === form.duration)?.label} after you
          sign. You see the exact date and time before signing.
        </p>
      )}
      {form.problems?.expiry ? (
        <p role="alert" className="text-sm text-destructive">
          {form.problems.expiry}
        </p>
      ) : null}
    </div>
  );
}
