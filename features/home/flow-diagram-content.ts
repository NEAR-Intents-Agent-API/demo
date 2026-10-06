import {
  BiometricAccessIcon,
  Robot02Icon,
  SentIcon,
  Wallet01Icon,
} from "@hugeicons/core-free-icons";
import type { HugeiconsIcon } from "@hugeicons/react";

type Icon = Parameters<typeof HugeiconsIcon>[0]["icon"];

export type FlowDiagramNode = {
  step: string;
  owner: string;
  title: string;
  icon: Icon;
  lines: string[];
  accent?: boolean;
  verbs?: boolean;
  chains?: boolean;
};

export const NODES: FlowDiagramNode[] = [
  {
    step: "1",
    owner: "You",
    title: "Owner",
    icon: BiometricAccessIcon,
    lines: ["Wallet or passkey", "Signs the rules once", "Can revoke any time"],
  },
  {
    step: "2",
    owner: "Your rules",
    title: "Rules & limits",
    icon: Wallet01Icon,
    lines: ["Tokens allowed", "USD budget", "Destinations & delay"],
    accent: true,
  },
  {
    step: "3",
    owner: "The agent",
    title: "Custody wallet",
    icon: Robot02Icon,
    lines: [
      "Holds public & private balances",
      "Acts through MCP or API",
      "Cannot exceed the rules",
    ],
    verbs: true,
  },
  {
    step: "4",
    owner: "The world",
    title: "Any network",
    icon: SentIcon,
    lines: ["Deposit from anywhere", "Swap, transfer, withdraw", "Settle on any chain"],
    chains: true,
  },
];

export const LINKS = ["You sign", "Enforced on every move", "Settles across networks"] as const;
