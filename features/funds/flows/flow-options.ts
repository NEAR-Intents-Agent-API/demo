import {
  ArrowDataTransferHorizontalIcon,
  ArrowDown02Icon,
  ArrowUp02Icon,
  SentIcon,
  ViewOffSlashIcon,
} from "@hugeicons/core-free-icons";

export type FlowId = "deposit" | "swap" | "send" | "withdraw" | "shield";
export const FLOWS = [
  {
    id: "deposit",
    label: "Deposit",
    hint: "Fund the confidential balance from another network or a NEAR Intents account.",
    icon: ArrowDown02Icon,
  },
  {
    id: "swap",
    label: "Swap",
    hint: "Trade one token for another in the confidential balance.",
    icon: ArrowDataTransferHorizontalIcon,
  },
  {
    id: "send",
    label: "Transfer",
    hint: "Pay another NEAR Intents account from the confidential balance.",
    icon: SentIcon,
  },
  {
    id: "withdraw",
    label: "Withdraw",
    hint: "Send funds out of the account to an address on any network.",
    icon: ArrowUp02Icon,
  },
  {
    id: "shield",
    label: "Shield",
    hint: "Move a token from the legacy public balance to the confidential balance.",
    icon: ViewOffSlashIcon,
  },
] as const;
