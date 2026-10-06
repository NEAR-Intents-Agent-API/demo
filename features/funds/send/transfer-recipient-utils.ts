import type { DestinationRule } from "@near-intents-agent-api/sdk";
import { destinationName } from "../access/destination-utils";

/** Open rules accept typed accounts; restricted rules resolve display labels to account IDs. */
export function transferRecipient(
  rule: DestinationRule | undefined,
  action: "intents_transfer" | "confidential_transfer",
  selected: string | null,
) {
  if (rule && rule.mode !== "only")
    return { open: true, destinations: [], recipient: selected || null };
  const approved = (rule?.list ?? []).filter(
    (item) =>
      item.action === "transfer" && item.confidential === (action === "confidential_transfer"),
  );
  return {
    open: false,
    destinations: approved.map(destinationName),
    recipient: approved.find((item) => destinationName(item) === selected)?.address ?? null,
  };
}
