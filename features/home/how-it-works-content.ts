export type Who = "You sign" | "Agent alone" | "No one";

export const MOVES: { verb: string; asset: string; what: string; who: Who; guard: string }[] = [
  {
    verb: "Deposit",
    asset: "Deposit",
    who: "No one",
    what: "Fund the agent's public balance through NEAR Intents from a supported network.",
    guard: "Receiving funds needs no approval and does not spend the account’s balance.",
  },
  {
    verb: "Swap",
    asset: "Network2",
    who: "Agent alone",
    what: "Exchange assets across supported chains, with a quoted rate and a minimum amount to receive.",
    guard: "Uses only allowed tokens and counts toward your USD budget.",
  },
  {
    verb: "Transfer",
    asset: "Transfer",
    who: "Agent alone",
    what: "Send funds to another NEAR Intents account.",
    guard: "Uses approved destinations and counts toward your USD budget.",
  },
  {
    verb: "Withdraw",
    asset: "Withdraw",
    who: "Agent alone",
    what: "Send funds to an approved address on a supported network.",
    guard: "A withdrawal delay gives you time to cancel.",
  },
  {
    verb: "Public & Private Balances",
    asset: "Private",
    who: "Agent alone",
    what: "Move funds between the account’s public and private balances.",
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

export const SITE_NODES = [
  {
    owner: "YOU",
    title: "Owner",
    asset: "User",
    lines: ["Wallet or passkey", "Signs the rules once", "Can revoke any time"],
  },
  {
    owner: "YOUR RULES",
    title: "Rules & limits",
    asset: "Rules",
    lines: ["Tokens allowed", "USD budget", "Destinations & delay"],
  },
  {
    owner: "THE AGENT",
    title: "Custody wallet",
    asset: "Agent",
    lines: [
      "Holds public & private balances",
      "Acts through MCP or API",
      "Cannot exceed the rules",
    ],
  },
  {
    owner: "THE WORLD",
    title: "Any network",
    asset: "Network1",
    lines: ["Deposit from anywhere", "Swap, transfer, withdraw", "Settle on any chain"],
  },
] as const;
