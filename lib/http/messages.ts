const defaultErrorMessage = "The request failed. Check the server logs.";

export const errorMessages: Record<string, string> = {
  login_required: "Sign in again to continue.",
  agent_not_found: "This agent is not available.",
  agent_not_bound: "This agent is not active yet. Sign its activation request first.",
  onboarding_not_pending: "This agent's activation request was already submitted.",
  onboarding_expired: "The activation request expired. Create the agent again.",
  onboarding_not_broadcast:
    "The activation request never reached the chain. Create the agent again.",
  onboarding_failed: "Activation failed. Create the agent again.",
  onboarding_confirmation_timeout:
    "Activation is still confirming. Open the agent and check its status in a moment.",
  onboarding_not_found: "This agent has no activation request.",
  policy_transaction_failed: "The activation transaction failed on chain.",
  wallet_request_signature_invalid:
    "The signature did not verify. Sign again with the same wallet.",
  policy_delegate_signature_invalid:
    "The signature did not verify. Sign again with the same wallet.",
  agent_api_unreachable: "The Agent API is unreachable. Retry in a moment.",
  network_mismatch: "The Agent API is on a different network than this dashboard.",
  wallet_network_unsupported: "Passkey and EVM owner wallets require NEAR mainnet.",
  owner_identity_missing: "No owner identity for this session.",
  owner_account_mismatch: "Select the NEAR account that owns this agent, then try signing again.",
  wallet_signature_missing: "The wallet did not return a signature. Try again.",
  wallet_request_pending: "A wallet request is already open. Finish or cancel it first.",
  owner_proof_invalid: "The signature did not verify. Sign again with the same wallet.",
  owner_nonce_invalid: "This consent request expired or was replaced. Start again.",
  invalid_approval_count: "Enter a whole number of approvals, or zero to disable them.",
  intent_not_found: "This signing request is unavailable. Reload the page.",
  intent_expired: "This signing request expired. Generate a new request.",
  intent_payload_mismatch: "The signed payload differs from the request. Reload and sign again.",
  signer_mismatch: "Use the wallet that owns this agent.",
  signature_invalid: "The wallet returned an invalid signature.",
  policy_challenge_invalid: "This policy revision expired or was already submitted.",
  policy_revision_conflict:
    "The policy changed while you were editing. Reload and sign the new revision.",
  policy_submission_unconfirmed: "The provider has not confirmed the policy yet. Refresh it.",
  policy_submission_uncertain: "Policy outcome unknown. Reconcile the operation; do not resubmit.",
  provider_policy_mismatch: "The provider policy does not match the signed revision.",
  policy_update_disabled: "Policy writes are disabled on this deployment.",
  policy_hash_mismatch: "The prepared policy hash does not match the signed policy.",
  approval_closed: "This approval was already decided or has expired.",
  approval_changed: "The approval request changed. Reload and review it again.",
  approval_not_found: "This approval is not available for this agent.",
  approval_challenge_invalid: "This approval request expired. Prepare it again.",
  owner_mismatch: "This owner cannot authorize the requested action.",
  owner_key_not_full_access: "The owner account key is not a full-access key.",
  client_not_found: "This client is unavailable for this account.",
  client_revoked: "This client was revoked. Connect it again to create new access.",
  client_already_authorized:
    "This client is already authorized. Reconnect from the client, or revoke its access first.",
  client_access_conflict: "Client access changed. Refresh Connect and retry.",
  oauth_query_invalid:
    "This authorization request expired or changed. Restart connection from your client.",
  consent_failed:
    "OAuth completion failed. Restart connection from your client; access remains inactive.",
  grant_challenge_invalid:
    "This signing request expired or was already submitted. Review the client and retry.",
  grant_install_failed:
    "Grant authorization failed. Revoke this pending client, then connect again.",
  grant_authorization_pending:
    "Grant outcome is still pending. Retry to check its saved operation.",
  grant_revocation_pending: "Access is blocked. Retry to finish signed grant revocation.",
  grant_revoke_failed: "Access is blocked, but grant revocation failed. Retry completion.",
  access_required:
    "Authorize dashboard first. One grant lets the dashboard act under the account's rules until it expires.",
  owner_approval_unsupported:
    "Owner approval needs a NEAR owner. Turn it off in Rules, or use a NEAR account as owner.",
  policy_destination_denied:
    "This action, network, address or memo is not in the account's destination rule. Add it once with one signature; the dashboard and every connected client can then use it.",
  permission_update_pending: "Permission update is pending. Check Activity before signing again.",
  policy_change_throttled:
    "Account-rule changes are cooling down. Wait until the shown deadline, then retry.",
  provider_refused: "The provider refused the request.",
  provider_rate_limited: "The provider rate limit was reached. Retry shortly.",
  provider_unavailable: "The provider is temporarily unavailable.",
  policy_denied:
    "This account's rules do not allow this (token, action, destination or per-token limit). Raising the USD budget will not change that; update the blocking rule in Rules.",
  policy_not_ready:
    "The latest rules change is still applying. Moves on this account resume once the provider confirms it.",
  policy_action_denied:
    "The account's rules turn this action off. Turn it on in Rules; the dashboard and every connected client can then use it, with no new grant.",
  insufficient_balance: "The custody wallet does not hold enough of this asset.",
  route_unavailable:
    "This route is not available from the provider right now. Nothing was sent; try another token or try again later.",
  quote_unavailable:
    "The swap quote timed out at the provider. Nothing was sent; try again in a moment.",
  wallet_frozen: "The owner froze this account. Executions resume once the owner unfreezes it.",
  spend_budget_exceeded:
    "Account spending limit reached. Open Rules > Edit policy, sign a new limit, then retry. You and all connected clients share this limit.",
  policy_schedule_denied:
    "The account's schedule holds money actions at the time this would run. Nothing was sent; try again once the schedule opens, or change it in Rules.",
  spend_price_unavailable:
    "No current USD price for this asset, so the account's USD budget cannot count it. Try again later.",
  invalid_request: "The request was rejected as invalid.",
  validation_failed: "The request was rejected as invalid.",
  internal_error: "An unexpected error occurred. Check the server logs.",
  request_failed: defaultErrorMessage,
  invalid_response: "The server returned an unreadable response. Try loading it again.",
  "User rejected": "Wallet request cancelled. Try again when you are ready.",
};

/** Human-readable text for a known API error code, with a safe fallback. */
export function errorMessage(code: string): string {
  const message = Object.hasOwn(errorMessages, code) ? errorMessages[code] : undefined;
  return message ?? defaultErrorMessage;
}

/**
 * Errors where trying the same request again could plausibly succeed.
 *
 * Some failures are statements about state — an agent with no owner, a revision that already
 * moved on — and offering "Try again" for those is a dead end that makes the demo look broken.
 * Unknown codes default to retryable, because withholding a retry is worse than offering one
 * that does not help.
 */
const PERMANENT_CODES = new Set([
  "intent_expired",
  "intent_not_found",
  "intent_payload_mismatch",
  "signer_mismatch",
  "agent_not_found",
  "agent_not_bound",
  "owner_identity_missing",
  "onboarding_not_pending",
  "onboarding_expired",
  "onboarding_not_broadcast",
  "onboarding_failed",
  "onboarding_not_found",
  "policy_transaction_failed",
  "owner_mismatch",
  "wallet_network_unsupported",
  "wallet_recovery_requires_policy_transfer",
  "owner_key_not_full_access",
  "owner_nonce_invalid",
  "policy_challenge_invalid",
  "policy_revision_conflict",
  "policy_hash_mismatch",
  "policy_update_disabled",
  "provider_policy_mismatch",
  "approval_closed",
  "approval_changed",
  "approval_not_found",
  "approval_challenge_invalid",
  "wallet_frozen",
  "insufficient_balance",
  "policy_destination_denied",
  "owner_approval_unsupported",
  "invalid_request",
  "validation_failed",
]);

export function isRetryable(code: string): boolean {
  return !PERMANENT_CODES.has(code);
}
