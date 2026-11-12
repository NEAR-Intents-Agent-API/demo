import type { Destination } from "@near-intents-agent-api/sdk";
import { z } from "zod";
import { chainInfo } from "@/features/assets";
import { canonicalDestination } from "@/lib/agent-api/schemas";

export const MEMO_MAX_LENGTH = 256;

/**
 * The route an owner picks for a destination, in the words the dashboard uses: a withdrawal or a
 * confidential transfer. A policy destination is `withdraw` or `transfer` with `confidential` set;
 * only a stored policy can still carry a public transfer, which the owner cannot add any more.
 */
export type DestinationAction = "withdraw" | "confidential_transfer";
export type DestinationContext = { action: DestinationAction; chain?: string };

type Draft = {
  action: DestinationAction;
  chain: string;
  address: string;
  memo: string;
  hasMemo: boolean;
};

/** What is missing or wrong before the draft can even be checked against the network. */
function draftProblem(input: Draft): string | null {
  if (input.action !== "withdraw") return input.address.trim() ? null : "Enter an account";
  if (!input.chain) return "Choose a network";
  if (!input.address.trim()) return "Enter a recipient address";
  if (input.hasMemo && input.memo.length === 0) return "Enter the memo, or choose No memo";
  if (input.memo.length > MEMO_MAX_LENGTH) return `Memo is at most ${MEMO_MAX_LENGTH} characters`;
  return null;
}

/**
 * Builds the destination an owner typed, or throws an `Error` whose message says exactly what is
 * wrong with it (missing network, malformed address, memo too long) for the form to show.
 */
export function destinationFromDraft(input: Draft): Destination {
  const problem = draftProblem(input);
  if (problem) throw new Error(problem);
  const address = input.address.trim();
  try {
    return canonicalDestination(
      input.action === "withdraw"
        ? {
            action: "withdraw",
            chain: input.chain,
            address,
            memo: input.hasMemo ? input.memo : null,
          }
        : {
            action: "transfer",
            address,
            confidential: input.action === "confidential_transfer",
          },
    );
  } catch (cause) {
    if (cause instanceof z.ZodError && cause.issues[0]) throw new Error(cause.issues[0].message);
    throw cause;
  }
}

export const DESTINATION_ACTIONS = [
  {
    value: "withdraw",
    label: "Withdraw to a wallet or exchange",
    description: "Send funds out of NEAR Intents to an address on the selected network.",
  },
  {
    value: "confidential_transfer",
    label: "Transfer to a confidential Intents account",
    description:
      "Send funds to another confidential account using the confidential transfer route.",
  },
] as const;

export function destinationName(destination: Destination): string {
  const route =
    destination.action === "withdraw"
      ? `Withdraw · ${chainInfo(destination.chain).name}`
      : destination.confidential
        ? "Confidential Intents transfer"
        : "Public Intents transfer";
  const memo =
    destination.action === "withdraw" && destination.memo !== null
      ? ` · Memo: ${destination.memo}`
      : "";
  return `${destination.address} · ${route}${memo}`;
}
