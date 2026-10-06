import { Field, FieldDescription, FieldError, FieldLabel } from "@/components/ui/field";
import { Input } from "@/components/ui/input";
import type { useDestinationDraft } from "./use-destination-draft";

export function DestinationAddressField({
  id,
  draft,
}: {
  id: string;
  draft: ReturnType<typeof useDestinationDraft>;
}) {
  return (
    <Field data-invalid={Boolean(draft.error)}>
      <FieldLabel htmlFor={`${id}-address`}>
        {draft.action === "withdraw" ? "Recipient wallet address" : "Recipient Intents account"}
      </FieldLabel>
      <Input
        id={`${id}-address`}
        value={draft.address}
        onChange={(event) => draft.setAddress(event.target.value)}
        spellCheck={false}
        autoCapitalize="none"
        autoComplete="off"
        maxLength={256}
        aria-invalid={Boolean(draft.error)}
        aria-describedby={`${id}-address-help`}
        placeholder={
          draft.action === "withdraw"
            ? "Paste the address supplied by the recipient"
            : "Paste the recipient's Intents account ID"
        }
      />
      <FieldDescription id={`${id}-address-help`}>
        {draft.action === "withdraw"
          ? "The rule covers this address, network and memo combination."
          : "Enter an Intents account, not an external wallet address. Public and private transfers are listed separately."}
      </FieldDescription>
      <FieldError>{draft.error}</FieldError>
    </Field>
  );
}
