export type Who = "You sign" | "Agent alone" | "No one";

export const MOVES: { verb: string; asset: string; what: string; who: Who; guard: string }[] = [
  {
    verb: "Deposit",
    asset: "Deposit",
    who: "No one",
    what: "Fund the agent's public balance through NEAR Intents from a supported network.",
    guard:
      "Receiving funds needs no approval and does not spend the account’s balance. Deposits are refused while the account is frozen.",
  },
  {
    verb: "Swap",
    asset: "Network2",
    who: "Agent alone",
    what: "Exchange assets across supported chains, with a quoted rate and a minimum amount to receive.",
    guard:
      "Uses only allowed tokens, counts toward your USD budget, and waits out any execution delay.",
  },
  {
    verb: "Transfer",
    asset: "Transfer",
    who: "Agent alone",
    what: "Send funds to another NEAR Intents account.",
    guard:
      "Uses approved destinations, counts toward your USD budget, and waits out any execution delay.",
  },
  {
    verb: "Withdraw",
    asset: "Withdraw",
    who: "Agent alone",
    what: "Send funds to an approved address on a supported network.",
    guard:
      "Uses approved destinations, counts toward your USD budget, and waits out any execution delay, which gives you time to cancel.",
  },
  {
    verb: "Private balance",
    asset: "Private",
    who: "Agent alone",
    what: "Make funds private or public by moving them between the account’s public and private balances.",
    guard: "Funds stay inside the agent account, under your rules.",
  },
];

export const KEYS = [
  {
    asset: "Lock",
    title: "Your Owner Key",
    body: "Your wallet or passkey signs rules, access grants, and approvals. It cannot spend the account’s funds directly.",
  },
  {
    asset: "Key",
    title: "API Access Grant",
    body: "Authorizes a client to act until an expiry date. Account rules limit its actions and destinations. Revoke access with one signature.",
  },
  {
    asset: "Wallet",
    title: "Custody Wallet",
    body: "Holds funds and signs transactions within your rules. Its keys stay with the custody provider.",
  },
];
