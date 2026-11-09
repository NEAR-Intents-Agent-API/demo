import {
  ArrowDataTransferHorizontalIcon,
  ArrowUp02Icon,
  ChartBreakoutSquareIcon,
  SentIcon,
  ViewOffSlashIcon,
} from "@hugeicons/core-free-icons";
import type { Ability } from "./rules";

/**
 * Each thing an agent can be allowed to do, in one sentence. The same words appear in the
 * editor, the rules summary and the wallet screen, so "off" means the same thing everywhere.
 */
export const ABILITY_INFO: Record<
  Ability,
  { title: string; description: string; icon: typeof SentIcon; off: string }
> = {
  swap: {
    title: "Swap",
    description: "Trade one token for another at the best NEAR Intents route.",
    icon: ArrowDataTransferHorizontalIcon,
    off: "Swaps are off for this account.",
  },
  limit_order: {
    title: "Limit orders",
    description:
      "Place orders that rest at a price you set and fill when the market reaches it. Switching this off cancels the orders still resting.",
    icon: ChartBreakoutSquareIcon,
    off: "Limit orders are off for this account.",
  },
  transfer: {
    title: "Transfer",
    description: "Pay another NEAR Intents account. Instant, with no network fee.",
    icon: SentIcon,
    off: "Transfers are off for this account.",
  },
  withdraw: {
    title: "Withdraw",
    description: "Move funds out of NEAR Intents to an address on NEAR or another network.",
    icon: ArrowUp02Icon,
    off: "Withdrawals are off for this account.",
  },
  confidential: {
    title: "Confidential balance",
    description:
      "Hold and move funds in the confidential balance, off the public NEAR chain. Operators and solvers can still see them.",
    icon: ViewOffSlashIcon,
    off: "The confidential balance is off for this account.",
  },
};
