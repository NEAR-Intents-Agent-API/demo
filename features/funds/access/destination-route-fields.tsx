import { Field, FieldDescription, FieldLabel } from "@/components/ui/field";
import { NativeSelect, NativeSelectOption } from "@/components/ui/native-select";
import { chainInfo, useCatalog } from "@/features/assets";
import { DESTINATION_ACTIONS, type DestinationAction } from "./destination-utils";
import type { useDestinationDraft } from "./use-destination-draft";

export function DestinationRouteFields({
  id,
  draft,
  lockedAction,
}: {
  id: string;
  lockedAction?: DestinationAction;
  draft: ReturnType<typeof useDestinationDraft>;
}) {
  const catalog = useCatalog();
  const networks = [...new Set([...catalog.chains, ...(draft.chain ? [draft.chain] : [])])];
  const description = DESTINATION_ACTIONS.find(
    (option) => option.value === draft.action,
  )?.description;
  return (
    <>
      {lockedAction ? (
        <p className="text-sm font-medium">
          {DESTINATION_ACTIONS.find((option) => option.value === lockedAction)?.label}
        </p>
      ) : (
        <Field>
          <FieldLabel htmlFor={`${id}-action`}>Use this destination for</FieldLabel>
          <NativeSelect
            id={`${id}-action`}
            value={draft.action}
            className="w-full"
            onChange={(event) => draft.setAction(event.target.value as DestinationAction)}
          >
            {DESTINATION_ACTIONS.map((option) => (
              <NativeSelectOption key={option.value} value={option.value}>
                {option.label}
              </NativeSelectOption>
            ))}
          </NativeSelect>
          <FieldDescription>{description} Approval applies to this action only.</FieldDescription>
        </Field>
      )}
      {draft.action === "withdraw" ? (
        <Field>
          <FieldLabel htmlFor={`${id}-network`}>Destination network</FieldLabel>
          <NativeSelect
            id={`${id}-network`}
            value={draft.chain}
            className="w-full"
            onChange={(event) => draft.setChain(event.target.value)}
            disabled={networks.length === 0}
          >
            <NativeSelectOption value="">
              {catalog.query.isPending ? "Loading supported networks…" : "Choose a network"}
            </NativeSelectOption>
            {networks.map((network) => (
              <NativeSelectOption key={network} value={network}>
                {chainInfo(network).name}
              </NativeSelectOption>
            ))}
          </NativeSelect>
          <FieldDescription>
            Funds arrive on this network. Other networks need separate approval.
            {catalog.query.error ? " Network catalogue unavailable; retry loading the page." : ""}
          </FieldDescription>
        </Field>
      ) : null}
    </>
  );
}
