import type { ApprovalView, StatusResponse } from "@near-intents-agent-api/sdk";

/** Provider vocabulary, made readable without changing its meaning. */
export function humanizeRequestType(requestType: string): string {
  const words = requestType.replaceAll("_", " ").toLowerCase();
  // However the provider spells the request that places an order, the owner is approving an order.
  return words.includes("limit order") ? "limit order" : words;
}

/**
 * One signed vote the API recorded before provider delivery. The approval's status comes from
 * the provider. `voter` is `near:<account>:<public_key>`, `evm:<account>` or `passkey:<account>`.
 */
export type ApprovalVote = ApprovalView["votes"][number];

const VOTER_METHODS: Record<string, string> = {
  near: "NEAR wallet",
  evm: "EVM wallet",
  passkey: "passkey",
};

/** Signed votes recorded on the approval. Older API versions omit the field. */
export function approvalVotes(approval: object): ApprovalVote[] {
  const votes = "votes" in approval ? approval.votes : undefined;
  if (!Array.isArray(votes)) return [];
  return votes.filter(
    (vote): vote is ApprovalVote =>
      Boolean(vote) &&
      typeof vote.voter === "string" &&
      typeof vote.voted_at === "string" &&
      (vote.verdict === "approve" || vote.verdict === "reject"),
  );
}

/**
 * The account and the way it signed, read from a principal id. A NEAR voter's key is dropped:
 * its account names the signer, and the key alone is not something an owner can check.
 */
export function describeVoter(voter: string): { account: string; method: string } {
  const [kind = "", account = voter] = voter.split(":");
  return { account, method: VOTER_METHODS[kind] ?? kind };
}

/**
 * Shown when a reject was recorded but the provider still holds the request. The API resends the
 * same signed reject a few times first; `repeat_required` is true only if the request stayed
 * pending after that, and then only a fresh signature can reject it. Null, false and a
 * `cancellation_observed` confirmation all read as an ordinary result.
 */
export const REJECT_AGAIN_NOTICE =
  "This request is still pending: the provider has not closed it after your rejection. Reject it again and sign once more.";

export function needsRejectAgain(operation: StatusResponse | null | undefined): boolean {
  return operation?.type === "approval_vote" && operation.details.repeat_required === true;
}
