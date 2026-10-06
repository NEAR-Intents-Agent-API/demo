import type { Destination } from "@near-intents-agent-api/sdk";
import { chainInfo } from "@/features/assets";
import { canonicalDestination } from "@/lib/agent-api/schemas";

/**
 * The route an owner picks for a destination, in the words the dashboard uses: a withdrawal, a
 * public transfer or a private transfer. A policy destination is `withdraw` or `transfer`, with
 * `confidential` marking the private transfer; `destinationRoute` and `destinationFromDraft`
 * convert between the two.
 */
export type DestinationAction = "withdraw" | "intents_transfer" | "confidential_transfer";
export type DestinationContext = { action: DestinationAction; chain?: string };

export function destinationRoute(destination: Destination): DestinationAction {
  if (destination.action === "withdraw") return "withdraw";
  return destination.confidential ? "confidential_transfer" : "intents_transfer";
}

export function destinationFromDraft(input: {
  action: DestinationAction;
  chain: string;
  address: string;
  memo: string;
  hasMemo: boolean;
}): Destination {
  if (input.hasMemo && input.memo.length === 0) throw new Error("Memo value is required");
  return canonicalDestination(
    input.action === "withdraw"
      ? {
          action: "withdraw",
          chain: input.chain,
          address: input.address,
          memo: input.hasMemo ? input.memo : null,
        }
      : {
          action: "transfer",
          address: input.address,
          confidential: input.action === "confidential_transfer",
        },
  );
}

export const DESTINATION_ACTIONS = [
  {
    value: "withdraw",
    label: "Withdraw to a wallet or exchange",
    description: "Send funds out of NEAR Intents to an address on the selected network.",
  },
  {
    value: "intents_transfer",
    label: "Transfer to a public Intents account",
    description: "Send funds to another NEAR Intents account. This is not a blockchain withdrawal.",
  },
  {
    value: "confidential_transfer",
    label: "Transfer to a private Intents account",
    description: "Send funds to another confidential account using the private transfer route.",
  },
] as const;

export function destinationName(destination: Destination): string {
  const route =
    destination.action === "withdraw"
      ? `Withdraw · ${chainInfo(destination.chain).name}`
      : destination.confidential
        ? "Private Intents transfer"
        : "Public Intents transfer";
  const memo =
    destination.action === "withdraw" && destination.memo !== null
      ? ` · Memo: ${destination.memo}`
      : "";
  return `${destination.address} · ${route}${memo}`;
}
