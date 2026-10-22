import { type ErrorDetails, errorDetails } from "@/lib/http/error-details";
import { DemoApiError } from "@/lib/http/request";

const budgetAdvice =
  "Raise the limit with Edit on the Rules tab (one signature), or wait until the period resets (shown on the Rules tab). You and all connected clients share this limit.";

/**
 * Plain-language text for every error code the Agent API, the BFF or a wallet ceremony can hand
 * this app. Add a code here when the API adds one; `error-messages.test.ts` lists the API's codes
 * and fails when one has no message.
 */
export const errorMessages: Record<string, string> = {
  login_required: "Sign in again to continue.",
  agent_not_found: "This agent is not available.",
  agent_not_bound: "This agent is not active yet. Sign its activation request first.",
  agent_not_available: "This agent account is not available.",
  agent_archived: "This agent account is archived. Restore it to use it again.",
  pause_before_archive: "Freeze the account first, then archive it.",
  unpause_before_restore: "Unfreeze the account first, then restore it.",
  lifecycle_pending: "Still being processed. Check Activity, then refresh the account.",
  agent_not_archived: "This agent account is not archived.",
  agent_deleted: "This agent account was deleted.",
  agent_deletion_pending: "This agent account is being deleted.",
  agent_creation_quota_exceeded:
    "The demo has reached its limit for new agent accounts in a rolling 24 hours. Try again later.",
  deposit_quota_exceeded: "Too many deposit addresses were requested recently.",
  owner_type_unsupported: "This sign-in type cannot own an agent account on this deployment.",
  onboarding_not_pending: "This agent's activation request was already submitted.",
  onboarding_expired: "The activation request expired. Create the agent again.",
  onboarding_not_broadcast:
    "The activation request never reached the chain. Create the agent again.",
  onboarding_failed: "Activation failed. Create the agent again.",
  onboarding_confirmation_timeout:
    "Activation is still confirming. Open the agent and check its status in a moment.",
  onboarding_not_found: "This agent has no activation request.",
  onboarding_conflict: "Activation is already in progress for this agent account.",
  policy_transaction_failed: "The activation transaction failed on chain.",
  wallet_request_signature_invalid:
    "The signature did not verify. Sign again with the same wallet.",
  policy_delegate_signature_invalid:
    "The signature did not verify. Sign again with the same wallet.",
  agent_api_unreachable: "The Agent API is unreachable. Retry in a moment.",
  network_unreachable: "Could not reach the dashboard server. Check your connection and try again.",
  network_mismatch: "The Agent API is on a different network than this dashboard.",
  wallet_network_unsupported: "Passkey and EVM owner wallets require NEAR mainnet.",
  owner_identity_missing: "No owner identity for this session.",
  owner_account_mismatch: "Select the NEAR account that owns this agent, then try signing again.",
  wallet_signature_missing: "The wallet did not return a signature. Try again.",
  wallet_request_pending: "A wallet request is already open. Finish or cancel it first.",
  wallet_request_cancelled: "Wallet request cancelled. Try again when you are ready.",
  passkey_prompt_closed:
    "The passkey prompt closed: it was cancelled, timed out, or this device has no passkey for this owner.",
  owner_proof_invalid: "The signature did not verify. Sign again with the same wallet.",
  owner_nonce_invalid: "This consent request expired or was replaced. Start again.",
  owner_command_expired: "This signing request expired. Start again.",
  owner_command_stale: "The account changed since this request was prepared. Start again.",
  owner_control_expired: "This signing request expired. Start again.",
  owner_counter_conflict: "Another signing request was used first. Start again.",
  invalid_approval_count: "Enter a whole number of approvals, or zero to disable them.",
  intent_not_found: "This signing request is unavailable. Reload the page.",
  intent_expired: "This signing request expired. Start it again to get a fresh one.",
  intent_not_pending: "This signing request was already used. Reload the page.",
  intent_payload_mismatch: "The signed payload differs from the request. Reload and sign again.",
  intent_standard_mismatch: "The wallet signed in a different format than requested. Sign again.",
  intent_type_mismatch: "This signing request is for a different action. Reload the page.",
  signer_mismatch: "Use the wallet that owns this agent.",
  signature_invalid: "The wallet returned an invalid signature.",
  policy_challenge_invalid: "This policy revision expired or was already submitted.",
  policy_revision_conflict:
    "The policy changed while you were editing. Reload and sign the new revision.",
  policy_submission_unconfirmed: "The provider has not confirmed the policy yet. Refresh it.",
  policy_submission_uncertain: "Policy outcome unknown. Reconcile the operation; do not resubmit.",
  policy_change_in_flight:
    "A rules change is still settling. Wait for it to finish, then try again.",
  policy_reconciliation_required:
    "Another rules change is still waiting to be signed or applied. Wait for it to finish, then try again.",
  policy_storage_changed: "Storage costs changed while you were signing. Start the change again.",
  provider_policy_mismatch: "The provider policy does not match the signed revision.",
  policy_update_disabled: "Policy writes are disabled on this deployment.",
  policy_hash_mismatch: "The prepared policy hash does not match the signed policy.",
  policy_blocks_delete:
    "This account's rules were signed in an older format. Sign a new rules change first, then delete the account.",
  approval_closed: "This approval was already decided or has expired.",
  approval_changed: "The approval request changed. Reload and review it again.",
  approval_not_found: "This approval is not available for this agent.",
  approval_challenge_invalid: "This approval request expired. Prepare it again.",
  approval_already_voted: "This account already voted on this approval.",
  approval_not_allowed: "This owner is not on the approver list in the account's rules.",
  approval_signature_invalid: "The approval signature was refused. Prepare the vote again.",
  approval_vote_unsupported: "This owner's wallet cannot vote on approvals on this network.",
  owner_mismatch:
    "The signed request does not match this agent's owner. Start again and sign with the wallet that owns this agent.",
  policy_delegate_owner_mismatch:
    "The rules change was signed by a different account or key than this agent's owner. Sign again with the wallet that owns this agent.",
  policy_delegate_action_mismatch:
    "Your wallet changed the transaction (its gas, deposit or target) before signing, so it cannot be accepted. Try again, or sign with another wallet.",
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
  grant_limit_reached:
    "This account already has the maximum number of live grants. Revoke one you no longer need.",
  grant_not_found: "This access grant is no longer available.",
  grant_expiry_invalid: "Choose an expiry time that is in the future and within the allowed range.",
  grant_action_unsupported: "This access grant cannot cover that action.",
  access_required:
    "Authorize dashboard first. One grant lets the dashboard act under the account's rules until it expires.",
  agent_grant_required: "This connection has no live grant. Authorize it first.",
  policy_destination_denied:
    "This action, network, address or memo is not in the account's destination rule. Add it once with one signature; the dashboard and every connected client can then use it.",
  permission_update_pending: "Permission update is pending. Check Activity before signing again.",
  policy_change_throttled:
    "Account rules were changed recently, so the next change has to wait a few minutes. Freezing the account is still available.",
  agent_unfreeze_throttled:
    "Unfreezing has a short wait after a freeze. Try again in a few minutes.",
  provider_refused: "The provider refused the request.",
  provider_rate_limited: "The provider rate limit was reached. Retry shortly.",
  provider_limit_reached:
    "This account has used its 100 wallet operations for the day at the provider, previews included. Nothing was sent.",
  provider_unavailable: "The provider is temporarily unavailable.",
  provider_response_invalid: "The provider sent an answer this app could not read. Try again.",
  provider_credential_invalid: "The service could not reach the provider. Try again later.",
  provider_policy_unavailable: "The provider could not read the account's rules. Try again.",
  rate_limited: "Too many requests. Wait a moment, then try again.",
  database_busy: "The service is busy. Try again in a moment.",
  sponsor_busy: "The service is busy submitting other transactions. Try again in a moment.",
  sponsor_balance_insufficient: "The service cannot pay network fees right now. Try again later.",
  wallet_sponsor_disabled: "This deployment cannot submit owner actions right now.",
  wallet_resolver_unavailable: "The owner wallet could not be checked right now. Try again.",
  near_rpc_unavailable:
    "The NEAR network did not answer, so the recipient could not be checked. Nothing was sent; try again in a moment.",
  wallet_rpc_unavailable: "The NEAR network did not answer. Try again in a moment.",
  transaction_unconfirmed:
    "The transaction was sent, but its confirmation has not been seen yet. Check Activity before trying again.",
  policy_denied:
    "This account's rules do not allow this: the token, action, destination, per-token limit or moves-per-hour cap. Raising the USD budget will not change that; change the blocking rule on the Rules tab.",
  policy_limit_exceeded:
    "This would go over the account's per-token limit for this hour, day or month. Moving funds between the public and private balance counts too. Raise the limit on the Rules tab, or wait until earlier moves age out.",
  policy_action_limit_exceeded:
    "The account has used its moves for this hour. Wait until earlier moves age out of the hour, or raise the moves-per-hour cap on the Rules tab.",
  policy_usage_unavailable:
    "This account has earlier moves that cannot be counted against its per-token limits yet. Nothing was sent. Moves of limited tokens resume once those age out.",
  withdraw_preview_pending: "A preview of this withdrawal is still running. Try again in a moment.",
  withdraw_preview_expired: "This withdrawal preview has expired. Preview it again.",
  withdraw_preview_limit_reached:
    "This account has used its 20 withdrawal previews for the last 24 hours. Previews resume as earlier ones age out.",
  policy_not_ready:
    "The latest rules change is still applying. Moves on this account resume once the provider confirms it.",
  policy_action_denied:
    "The account's rules turn this action off. Turn it on in Rules; the dashboard and every connected client can then use it, with no new grant.",
  policy_deposit_limit: "The rules change is too large to store. Simplify the rules and try again.",
  signing_policy_denied:
    "The account's rules do not list this service for NEAR sign-in. Add it under Native accounts in Rules first.",
  signing_recipient_forbidden: "Agent accounts never sign for the NEAR Intents contracts.",
  native_method_denied:
    "The account's rules do not switch this native method on, or do not list this contract or domain. Change it under Native accounts in Rules.",
  native_contract_forbidden:
    "Agent accounts never send to or call the NEAR Intents contracts from their NEAR account.",
  sign_recipient_denied:
    "The account's rules do not list this service for NEAR sign-in. Add it under Native accounts in Rules first.",
  insufficient_balance: "This account does not hold enough of this token.",
  amount_too_low: "This amount is below the minimum for this route. Try a larger amount.",
  invalid_address:
    "The recipient is not a valid address for this network, a named NEAR account that does not exist, or the provider refused it. Nothing was sent. Check it and retry.",
  unsupported_token: "This token is not supported for this route right now. Try another token.",
  unsupported_chain: "This network is not supported for this move. Try another network.",
  refund_address_required:
    "This route needs a refund address on the source network, and this account has none. Try another token or route.",
  custody_native_balance_required:
    "This move needs a small balance of the network's own coin in the account, and it has none. Nothing was sent.",
  route_unavailable:
    "This route is not available from the provider right now. Nothing was sent; try another token or try again later.",
  quote_unavailable:
    "The swap quote got no answer at the provider. Nothing was sent; try again in a moment.",
  wallet_busy:
    "Another move on this account is still running. Wait for it to finish, then try again.",
  wallet_frozen: "This account is frozen. Money moves are refused until you unfreeze it.",
  wallet_not_provisioned: "This account's wallet is not set up yet. Finish activation first.",
  wallet_not_active: "This account's wallet is not active yet. Try again once it is.",
  wallet_provisioning_uncertain:
    "Wallet setup is still confirming. Check the agent in a moment before trying again.",
  wallet_provisioning_failed: "Wallet setup failed. Create the agent account again.",
  execution_not_cancellable:
    "This move can no longer be cancelled: its execution delay has ended or it already ran.",
  operation_not_found: "This operation is not available. Reload the page.",
  operation_kind_mismatch: "This operation is for a different action. Reload the page.",
  operation_not_pending: "This operation already finished.",
  operation_not_recoverable: "This operation cannot be recovered.",
  operation_retired: "This operation is no longer available.",
  status_not_found: "This request is not available. Reload the page.",
  deletion_unavailable: "Deleting accounts is not available right now. Try again later.",
  delete_submission_uncertain:
    "The deletion may or may not have gone through. Reload and check the account before trying again.",
  spend_budget_exceeded: `The account's USD spending limit does not leave room for this. ${budgetAdvice}`,
  policy_schedule_denied:
    "The account's schedule does not allow money moves at the time this would run. Nothing was sent. Try again once the schedule opens, or change the schedule on the Rules tab.",
  spend_price_unavailable:
    "No current USD price for this asset, so the account's USD budget cannot count it. Try again later.",
  invalid_request: "The request was rejected as invalid.",
  validation_failed: "The request was rejected as invalid.",
  invalid_response: "The server returned an unreadable response. Try loading it again.",
  request_failed: "The request failed. Try again.",
  internal_error: "Something went wrong on our side (internal_error). Try again.",
};

/** Retry-aware wording for the codes whose refusal carries a time. `{time}` is a local time. */
const timedMessages: Record<string, string> = {
  policy_change_throttled:
    "Account rules were changed recently. You can change them again after {time}. Freezing the account is still available.",
  agent_unfreeze_throttled: "Unfreezing has a short wait after a freeze. Try again after {time}.",
  agent_creation_quota_exceeded:
    "The demo has reached its limit for new agent accounts in a rolling 24 hours. Try again after {time}.",
  policy_schedule_denied:
    "The account's schedule does not allow money moves at the time this would run. Nothing was sent. Try again after {time}, or change the schedule on the Rules tab.",
};

const ownerKeyMessage =
  "Your wallet signed with a different key than this agent's owner key. Reconnect the wallet and try again.";
const ownerWalletMessage = "Sign with the wallet that owns this agent.";
const otherAgentMessage = "This request was prepared for another agent or app. Start again.";
const changedTransaction = (what: string) =>
  `Your wallet changed the transaction (${what}) before signing, so it cannot be accepted. Try again, or sign with another wallet.`;

/**
 * Sharper text for the mismatch codes, by the last segment of the API's `source.pointer`. One code
 * covers every binding the API checks, so the code alone cannot say what to fix.
 */
const pointerMessages: Record<string, Record<string, string>> = {
  owner_mismatch: {
    network: "This message was signed for another NEAR network.",
    account_id: ownerWalletMessage,
    owner: ownerWalletMessage,
    public_key: ownerKeyMessage,
    previous_public_key:
      "This agent's owner key changed since this request was prepared. Start again.",
    tenant_id: otherAgentMessage,
    agent_id: otherAgentMessage,
    recipient: otherAgentMessage,
  },
  signer_mismatch: {
    public_key: ownerKeyMessage,
    id: "This passkey is not the one that owns this agent. Choose the owner's passkey and try again.",
  },
  policy_delegate_owner_mismatch: {
    sender_id:
      "Your wallet signed as a different NEAR account than this agent's owner. Switch to the owner account and sign again.",
    public_key: ownerKeyMessage,
  },
  policy_delegate_action_mismatch: {
    gas: changedTransaction("its gas"),
    deposit: changedTransaction("its attached deposit"),
    receiver_id: changedTransaction("the contract it calls"),
    method_name: changedTransaction("the method it calls"),
    args: changedTransaction("its call arguments"),
    actions: changedTransaction("its list of actions"),
  },
};

function pointerMessage(code: string, pointer: string): string | undefined {
  const byField = Object.hasOwn(pointerMessages, code) ? pointerMessages[code] : undefined;
  const field = pointer.slice(pointer.lastIndexOf("/") + 1);
  return byField && Object.hasOwn(byField, field) ? byField[field] : undefined;
}

/** "14:32, 13 Oct" in the viewer's time zone (or `timeZone`, for tests). */
export function formatRetryTime(iso: string, timeZone?: string): string {
  const at = new Date(iso);
  const time = at.toLocaleTimeString("en-GB", {
    hour: "2-digit",
    minute: "2-digit",
    hourCycle: "h23",
    timeZone,
  });
  const day = at.toLocaleDateString("en-GB", { day: "numeric", month: "short", timeZone });
  return `${time}, ${day}`;
}

function parseErrorSource(source: unknown): { code: string; details: ErrorDetails } {
  if (typeof source === "string") return { code: source, details: {} };
  if (source instanceof DemoApiError)
    return { code: source.code, details: errorDetails(source.details) };
  if (source instanceof Error) return { code: source.message, details: {} };
  return { code: "request_failed", details: {} };
}

function baseMessage(code: string): string {
  const known = Object.hasOwn(errorMessages, code) ? errorMessages[code] : undefined;
  if (known) return known;
  return /^[a-z0-9_]{1,64}$/.test(code)
    ? `Something went wrong (${code}). Try again.`
    : "Something went wrong. Try again.";
}

/** Whole cents, but never a rounded-down "$0.00" while some budget remains. */
function usdLeft(usd: number): string {
  return usd > 0 && usd < 0.01 ? "less than $0.01" : `$${usd.toFixed(2)}`;
}

/**
 * Human-readable text for an API error code, or for the error carrying one. Pass the error itself
 * whenever you have it: its details add a local retry time, the USD left in a budget, and the
 * signed field a mismatch is about. Unknown codes get a plain sentence that names the code, never
 * advice about server logs.
 */
export function errorMessage(source: unknown): string {
  const { code, details } = parseErrorSource(source);
  if (code === "spend_budget_exceeded" && details.budget_remaining_usd !== undefined)
    return `The account has ${usdLeft(Number(details.budget_remaining_usd))} left in its USD budget, which is not enough for this. ${budgetAdvice}`;
  const pointed = details.pointer ? pointerMessage(code, details.pointer) : undefined;
  if (pointed) return pointed;
  const message = baseMessage(code);
  const retryAt = details.available_at;
  if (!retryAt || Date.parse(retryAt) <= Date.now()) return message;
  const time = formatRetryTime(retryAt);
  const timed = Object.hasOwn(timedMessages, code) ? timedMessages[code] : undefined;
  return timed ? timed.replace("{time}", time) : `${message} Try again after ${time}.`;
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
  "policy_delegate_owner_mismatch",
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
  "policy_denied",
  "policy_action_denied",
  "policy_change_throttled",
  "agent_unfreeze_throttled",
  "agent_creation_quota_exceeded",
  "spend_budget_exceeded",
  "policy_limit_exceeded",
  "policy_action_limit_exceeded",
  "policy_usage_unavailable",
  "withdraw_preview_limit_reached",
  "amount_too_low",
  "invalid_address",
  "unsupported_token",
  "unsupported_chain",
  "refund_address_required",
  "custody_native_balance_required",
  "owner_type_unsupported",
  "execution_not_cancellable",
  "operation_not_found",
  "operation_kind_mismatch",
  "agent_archived",
  "agent_deleted",
  "agent_deletion_pending",
  "policy_blocks_delete",
  "invalid_request",
  "validation_failed",
]);

export function isRetryable(code: string): boolean {
  return !PERMANENT_CODES.has(code);
}
