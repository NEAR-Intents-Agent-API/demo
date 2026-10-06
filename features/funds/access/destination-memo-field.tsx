import { Field, FieldDescription, FieldLabel } from "@/components/ui/field";
import { Input } from "@/components/ui/input";
import { NativeSelect, NativeSelectOption } from "@/components/ui/native-select";

export function DestinationMemoField({
  id,
  enabled,
  value,
  onEnabled,
  onChange,
}: {
  id: string;
  enabled: boolean;
  value: string;
  onEnabled: (enabled: boolean) => void;
  onChange: (value: string) => void;
}) {
  return (
    <Field>
      <FieldLabel htmlFor={`${id}-mode`}>Memo / destination tag</FieldLabel>
      <NativeSelect
        id={`${id}-mode`}
        value={enabled ? "exact" : "none"}
        onChange={(event) => onEnabled(event.target.value === "exact")}
        className="w-full"
      >
        <NativeSelectOption value="none">Recipient does not require a memo</NativeSelectOption>
        <NativeSelectOption value="exact">Recipient requires a memo / tag</NativeSelectOption>
      </NativeSelect>
      {enabled ? (
        <>
          <FieldLabel htmlFor={`${id}-value`}>Exact memo / tag from recipient</FieldLabel>
          <Input
            id={`${id}-value`}
            value={value}
            onChange={(event) => onChange(event.target.value)}
            spellCheck={false}
            maxLength={256}
          />
        </>
      ) : null}
      <FieldDescription>
        Use the value supplied by the receiving wallet or exchange. Only withdrawals with this exact
        memo are approved; without a memo, only withdrawals without one are approved.
      </FieldDescription>
    </Field>
  );
}
