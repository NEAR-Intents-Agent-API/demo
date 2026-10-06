import { chainInfo, knownChains } from "@/features/assets";

export const FLOW_CHAINS = ["eth", "base", "arb", "sol", "btc", "op"].map(chainInfo);
export const FLOW_TOKENS = ["USDC", "ETH", "BTC"] as const;
export const FLOW_ACTIONS = ["Swap", "Transfer", "Withdraw", "Shield"] as const;

export const FLOW_STEPS = [
  {
    id: "approve",
    step: "1 · YOU",
    title: "Owner",
    description: "Sign the rules with your wallet or passkey.",
  },
  {
    id: "limits",
    step: "2 · YOUR RULES",
    title: "Rules & limits",
    description: "Set allowed tokens, a USD budget, approved destinations, and a withdrawal delay.",
  },
  {
    id: "execute",
    step: "3 · THE AGENT",
    title: "Custody wallet",
    description: "Holds public and private balances. Your agent acts through MCP or API.",
  },
  {
    id: "networks",
    step: "4 · THE WORLD",
    title: `${knownChains().length} networks`,
    description: "Deposit via NEAR Intents. Swap, transfer, withdraw.",
  },
] as const;

export type FlowStep = (typeof FLOW_STEPS)[number];
