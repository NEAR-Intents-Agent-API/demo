import type { Destination } from "@near-intents-agent-api/sdk";
import { destinationRoute } from "./destination-utils";

const DESTINATION_ACTION_LABELS: Record<ReturnType<typeof destinationRoute>, string> = {
  withdraw: "Withdrawal",
  intents_transfer: "Public transfer",
  confidential_transfer: "Private transfer",
};

export function destinationActionLabel(destination: Destination): string {
  return DESTINATION_ACTION_LABELS[destinationRoute(destination)];
}
