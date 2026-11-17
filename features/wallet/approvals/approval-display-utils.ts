/** Provider vocabulary, made readable without changing its meaning. */
export function humanizeRequestType(requestType: string): string {
  const words = requestType.replaceAll("_", " ").toLowerCase();
  // However the provider spells the request that places an order, the owner is approving an order.
  return words.includes("limit order") ? "limit order" : words;
}

/**
 * One owner vote the API recorded on an approval. Typed here rather than from the SDK, whose
 * published `ApprovalView` does not carry `votes` yet.
 */
export type ApprovalVote = {
  /** `near:<account>:<public_key>`, `evm:<account>` or `passkey:<account>`. */
  voter: string;
  verdict: "approve" | "reject";
  voted_at: string;
};

const VOTER_METHODS: Record<string, string> = {
  near: "NEAR wallet",
  evm: "EVM wallet",
  passkey: "passkey",
};

/** The votes an approval reports; none when the API predates the field or nobody voted. */
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
