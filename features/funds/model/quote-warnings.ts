import { formatDisplay } from "@/lib/format/amount";
import { errorMessage } from "@/lib/http/messages";
import type { QuoteWarning } from "./quote";

/**
 * Plain words for one dry-run warning. A warning carries the code the live request would be
 * refused under, so the codes the app already words as refusals reuse that text; the ones below
 * are phrased for a preview, where nothing has been refused yet.
 */
export function warningMessage(
  warning: QuoteWarning,
  token: { symbol: string; decimals: number | null } | null,
): string {
  switch (warning.code) {
    case "policy_action_denied":
      return "The account's rules turn this action off, so the live request would be refused. Turn it on in Rules.";
    case "policy_destination_denied":
      return "The account's destination rule does not allow this address or network, so the live request would be refused. Approve it in Rules.";
    case "policy_asset_denied":
      return "The account's rules do not allow this token, so the live request would be refused. Change the token rule in Rules.";
    case "unsupported_token":
      return "This token is not supported for this route, so the live request would be refused. Choose another token.";
    case "invalid_address":
      return "The recipient is not a valid address for this network, so the live request would be refused. Check it.";
    case "insufficient_balance":
      return warning.availableAmount && token
        ? `Only ${formatDisplay(warning.availableAmount, token.decimals)} ${token.symbol} is available, so the live request would be refused. Send less or add funds.`
        : "The account does not have enough available, so the live request would be refused. Send less or add funds.";
    case "high_fee":
      return "The fee is more than 5% of the amount.";
    case "asset_delivered_as_is":
      return "This asset reaches HyperCore as itself, not as USDC. Only USDC funds a Hyperliquid account.";
    default:
      return errorMessage(warning.code);
  }
}
