import {
  ArrowDataTransferHorizontalIcon,
  ArrowDown02Icon,
  ArrowUp02Icon,
  SentIcon,
  ViewOffSlashIcon,
} from "@hugeicons/core-free-icons";

export type FlowId = "deposit" | "swap" | "send" | "withdraw" | "private";
export const FLOWS = [
  {
    id: "deposit",
    label: "Deposit",
    hint: "Fund either balance from another network or a NEAR Intents account.",
    icon: ArrowDown02Icon,
  },
  {
    id: "swap",
    label: "Swap",
    hint: "Trade one token for another, in the public or private balance.",
    icon: ArrowDataTransferHorizontalIcon,
  },
  {
    id: "send",
    label: "Transfer",
    hint: "Pay another NEAR Intents account, publicly or privately.",
    icon: SentIcon,
  },
  {
    id: "withdraw",
    label: "Withdraw",
    hint: "Send funds out of either balance to an address on any network.",
    icon: ArrowUp02Icon,
  },
  {
    id: "private",
    label: "Shield",
    hint: "Move a token between the public and private balance.",
    icon: ViewOffSlashIcon,
  },
] as const;
