"use client";

import type { UseFormReturn } from "react-hook-form";
import { Field, FieldDescription, FieldError, FieldLabel } from "@/components/ui/field";
import { Input } from "@/components/ui/input";
import type { CreateInput } from "../../../model/schemas";

export function NameStep({ form, locked }: { form: UseFormReturn<CreateInput>; locked: boolean }) {
  return (
    <Field data-invalid={form.formState.errors.name ? true : undefined}>
      <FieldLabel htmlFor="agent-name">Account name</FieldLabel>
      <FieldDescription id="agent-name-description">
        Choose a name you’ll recognize in your account list.
      </FieldDescription>
      <Input
        readOnly={locked}
        aria-invalid={Boolean(form.formState.errors.name)}
        aria-describedby="agent-name-description"
        id="agent-name"
        placeholder="Account name"
        autoComplete="off"
        className="h-11"
        {...form.register("name")}
      />
      {form.formState.errors.name ? (
        <FieldError>{form.formState.errors.name.message}</FieldError>
      ) : null}
    </Field>
  );
}
