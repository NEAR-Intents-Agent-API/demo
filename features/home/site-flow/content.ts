import { chainInfo } from "@/features/assets";

export const FLOW_CHAINS = ["eth", "base", "arb", "sol", "btc", "op"].map(chainInfo);
export const FLOW_TOKENS = ["USDC", "ETH", "BTC"] as const;
export const FLOW_ACTIONS = [
  { label: "Swap", asset: "flow-swap" },
  { label: "Transfer", asset: "flow-transfer" },
  { label: "Withdraw", asset: "flow-withdraw" },
  { label: "Make private", asset: "flow-shield" },
] as const;

/** The four steps; the last one names the live network count once the catalogue has loaded. */
export function flowSteps(networkCount: number | null) {
  return [
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
      description:
        "Set allowed tokens, a USD budget, approved destinations, and an execution delay.",
    },
    {
      id: "execute",
      step: "3 · THE AGENT",
      title: "Custody wallet",
      description: "Holds a public and a private balance. Your agent acts through MCP or API.",
    },
    {
      id: "networks",
      step: "4 · THE WORLD",
      title: networkCount === null ? "Networks" : `${networkCount} networks`,
      description: "Deposit via NEAR Intents. Swap, transfer, withdraw.",
    },
  ] as const;
}

export type FlowStep = ReturnType<typeof flowSteps>[number];
