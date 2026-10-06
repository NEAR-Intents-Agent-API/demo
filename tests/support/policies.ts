import type { Policy } from "@near-intents-agent-api/sdk";

/** A bounded Intents transfer policy: one token, one recipient, optional owner approval. */
export function transferPolicy(input: {
  recipient: string;
  token?: string;
  requireApproval?: boolean;
}): Policy {
  const token = input.token ?? "nep141:wrap.near";
  return {
    frozen: false,
    actions: ["transfer"],
    confidential: false,
    owner_approval: input.requireApproval ?? false,
    assets: [token],
    limits: { per_transaction: { [token]: "1000000000000000000000000" } },
    max_actions_per_hour: null,
    destinations: {
      mode: "only",
      list: [{ action: "transfer", address: input.recipient, confidential: false }],
    },
    budget: { daily_usd: null, weekly_usd: null, monthly_usd: null },
    timelock_ms: 0,
  };
}
