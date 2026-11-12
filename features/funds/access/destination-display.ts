import type { Destination } from "@near-intents-agent-api/sdk";

export function destinationActionLabel(destination: Destination): string {
  if (destination.action === "withdraw") return "Withdrawal";
  // A stored policy can still list a public transfer; it is replaced when the rules are saved.
  return destination.confidential ? "Confidential transfer" : "Public transfer";
}
