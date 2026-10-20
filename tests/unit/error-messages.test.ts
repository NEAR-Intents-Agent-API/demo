import assert from "node:assert/strict";
import { test } from "node:test";
import { errorMessage, errorMessages, formatRetryTime, isRetryable } from "../../lib/http/messages";
import { DemoApiError } from "../../lib/http/request";

/**
 * Error codes the Agent API can answer an owner dashboard with (api/apps/server/src: ApiError,
 * RelayError, providerRefusalCodes, the provider vote refusals) minus codes only an integrator,
 * operator or deployment bug can hit. Each one needs plain text so no refusal falls back to
 * the generic sentence.
 */
const apiCodes = [
  "agent_archived",
  "pause_before_archive",
  "unpause_before_restore",
  "agent_creation_quota_exceeded",
  "agent_deleted",
  "agent_deletion_pending",
  "agent_grant_required",
  "agent_not_archived",
  "agent_not_bound",
  "agent_not_found",
  "agent_unfreeze_throttled",
  "amount_too_low",
  "approval_already_voted",
  "approval_changed",
  "approval_closed",
  "approval_not_allowed",
  "approval_not_found",
  "approval_signature_invalid",
  "approval_vote_unsupported",
  "custody_native_balance_required",
  "database_busy",
  "delete_submission_uncertain",
  "deletion_unavailable",
  "deposit_quota_exceeded",
  "execution_not_cancellable",
  "grant_action_unsupported",
  "grant_expiry_invalid",
  "grant_limit_reached",
  "grant_not_found",
  "insufficient_balance",
  "intent_expired",
  "intent_not_found",
  "intent_not_pending",
  "intent_payload_mismatch",
  "intent_standard_mismatch",
  "intent_type_mismatch",
  "internal_error",
  "invalid_address",
  "invalid_request",
  "native_contract_forbidden",
  "native_method_denied",
  "onboarding_conflict",
  "onboarding_expired",
  "onboarding_not_found",
  "onboarding_not_pending",
  "operation_kind_mismatch",
  "operation_not_found",
  "operation_not_pending",
  "operation_not_recoverable",
  "operation_retired",
  "owner_command_expired",
  "owner_command_stale",
  "owner_control_expired",
  "owner_counter_conflict",
  "owner_key_not_full_access",
  "owner_mismatch",
  "owner_nonce_invalid",
  "owner_proof_invalid",
  "owner_type_unsupported",
  "policy_action_denied",
  "policy_blocks_delete",
  "policy_change_throttled",
  "policy_delegate_action_mismatch",
  "policy_delegate_owner_mismatch",
  "policy_delegate_signature_invalid",
  "policy_denied",
  "policy_deposit_limit",
  "policy_destination_denied",
  "policy_not_ready",
  "policy_reconciliation_required",
  "policy_revision_conflict",
  "policy_schedule_denied",
  "policy_storage_changed",
  "provider_credential_invalid",
  "provider_policy_mismatch",
  "provider_policy_unavailable",
  "provider_rate_limited",
  "provider_refused",
  "provider_response_invalid",
  "provider_unavailable",
  "quote_unavailable",
  "rate_limited",
  "refund_address_required",
  "route_unavailable",
  "sign_recipient_denied",
  "signature_invalid",
  "signer_mismatch",
  "signing_policy_denied",
  "signing_recipient_forbidden",
  "spend_budget_exceeded",
  "spend_price_unavailable",
  "sponsor_balance_insufficient",
  "sponsor_busy",
  "status_not_found",
  "transaction_unconfirmed",
  "unsupported_chain",
  "unsupported_token",
  "validation_failed",
  "wallet_busy",
  "wallet_frozen",
  "wallet_network_unsupported",
  "wallet_not_active",
  "wallet_not_provisioned",
  "wallet_provisioning_failed",
  "wallet_provisioning_uncertain",
  "wallet_request_signature_invalid",
  "wallet_resolver_unavailable",
  "wallet_rpc_unavailable",
  "wallet_sponsor_disabled",
];

test("every API error code has its own plain-language message, never the fallback", () => {
  for (const code of apiCodes) {
    assert.ok(Object.hasOwn(errorMessages, code), `${code} has a message`);
    assert.notEqual(errorMessage(code), `Something went wrong (${code}). Try again.`, code);
  }
});

/** Codes the dashboard itself raises (wallet ceremonies, the rules workflow), not the API. */
const clientCodes = [
  "wallet_request_cancelled",
  "passkey_prompt_closed",
  "wallet_request_pending",
  "policy_change_in_flight",
];

test("every client-side code has its own plain-language message", () => {
  for (const code of clientCodes) {
    assert.ok(Object.hasOwn(errorMessages, code), `${code} has a message`);
    assert.notEqual(errorMessage(code), `Something went wrong (${code}). Try again.`, code);
  }
});

test("the removed owner_approval_unsupported code no longer has a message", () => {
  assert.equal(Object.hasOwn(errorMessages, "owner_approval_unsupported"), false);
});

test("a retry time is shown in the viewer's local time", () => {
  assert.equal(formatRetryTime("2026-10-13T14:32:00.000Z", "UTC"), "14:32, 13 Oct");
  assert.equal(formatRetryTime("2026-10-13T23:05:00.000Z", "Europe/Kyiv"), "02:05, 14 Oct");
  const availableAt = new Date(Date.now() + 10 * 60_000).toISOString();
  for (const code of [
    "policy_change_throttled",
    "agent_unfreeze_throttled",
    "agent_creation_quota_exceeded",
    "policy_schedule_denied",
    "wallet_busy",
  ]) {
    const message = errorMessage(new DemoApiError(code, 429, { available_at: availableAt }));
    assert.match(message, /\d\d:\d\d, \d{1,2} \p{L}{3}/u, code);
    assert.doesNotMatch(message, /shown deadline/);
  }
});

test("a retry time in the past or an error without one adds no time", () => {
  const past = new Date(Date.now() - 60_000).toISOString();
  assert.equal(
    errorMessage(new DemoApiError("policy_change_throttled", 429, { available_at: past })),
    errorMessages.policy_change_throttled,
  );
  assert.equal(errorMessage(new DemoApiError("wallet_busy", 409)), errorMessages.wallet_busy);
});

test("a budget refusal names the USD left and points at the Edit button", () => {
  const message = errorMessage(
    new DemoApiError("spend_budget_exceeded", 403, { budget_remaining_usd: "1.5" }),
  );
  assert.match(message, /\$1\.50 left/);
  assert.match(message, /Edit on the Rules tab/);
  assert.doesNotMatch(message, /Rules > Edit policy/);
  assert.doesNotMatch(errorMessages.spend_budget_exceeded ?? "", /Rules > Edit policy/);
  assert.match(errorMessage("spend_budget_exceeded"), /Edit on the Rules tab/);
});

test("denied rules name the per-token limit and the moves-per-hour cap", () => {
  assert.match(errorMessage("policy_denied"), /per-token limit/);
  assert.match(errorMessage("policy_denied"), /moves-per-hour cap/);
});

test("errorMessage takes a code, a plain Error or an unknown value", () => {
  assert.equal(errorMessage(new Error("wallet_busy")), errorMessages.wallet_busy);
  assert.equal(errorMessage("wallet_busy"), errorMessages.wallet_busy);
  assert.equal(errorMessage({ weird: true }), errorMessages.request_failed);
  assert.equal(
    errorMessage(new Error("brand_new_code")),
    "Something went wrong (brand_new_code). Try again.",
  );
});

test("cooldown and refusal states offer no instant retry", () => {
  for (const code of ["agent_unfreeze_throttled", "amount_too_low", "invalid_address"])
    assert.equal(isRetryable(code), false, code);
  assert.equal(isRetryable("wallet_busy"), true);
});

const mismatch = (code: string, pointer: string) =>
  errorMessage(new DemoApiError(code, 409, { pointer }));

test("owner_mismatch names what differs, from the signed field the API points at", () => {
  const at = (field: string) => mismatch("owner_mismatch", `/signed_data/payload/message/${field}`);
  assert.equal(at("network"), "This message was signed for another NEAR network.");
  assert.equal(at("account_id"), "Sign with the wallet that owns this agent.");
  assert.equal(at("owner"), "Sign with the wallet that owns this agent.");
  assert.match(at("public_key"), /different key than this agent's owner key\. Reconnect/);
  assert.match(at("previous_public_key"), /owner key changed since this request was prepared/);
  for (const field of ["tenant_id", "agent_id", "recipient"])
    assert.equal(at(field), "This request was prepared for another agent or app. Start again.");
});

test("a mismatch without a pointer keeps the generic text, never the old misleading one", () => {
  assert.match(errorMessage("owner_mismatch"), /does not match this agent's owner/);
  assert.doesNotMatch(errorMessage("owner_mismatch"), /cannot authorize/);
  assert.equal(errorMessage(new DemoApiError("owner_mismatch", 409)), errorMessages.owner_mismatch);
  assert.equal(
    mismatch("wallet_busy", "/signed_data/payload/message/network"),
    errorMessages.wallet_busy,
  );
});

test("signer and delegate-owner mismatches point at the key, passkey or account", () => {
  assert.match(mismatch("signer_mismatch", "/signed_data/public_key"), /different key/);
  assert.match(mismatch("signer_mismatch", "/signed_data/credential/id"), /passkey/);
  assert.match(
    mismatch("policy_delegate_owner_mismatch", "/signed_data/signed_delegate/sender_id"),
    /different NEAR account/,
  );
  assert.match(
    mismatch("policy_delegate_owner_mismatch", "/signed_data/signed_delegate/public_key"),
    /different key/,
  );
});

test("a delegate action mismatch says which part of the transaction the wallet changed", () => {
  const at = (field: string) =>
    mismatch("policy_delegate_action_mismatch", `/signed_data/signed_delegate/${field}`);
  assert.match(at("actions/0/gas"), /changed the transaction \(its gas\)/);
  assert.match(at("actions/0/deposit"), /attached deposit/);
  assert.match(at("receiver_id"), /the contract it calls/);
  assert.match(at("actions/1/receiver_id"), /the contract it calls/);
  assert.match(at("actions/0/method_name"), /the method it calls/);
  assert.match(at("actions/0/args"), /call arguments/);
  assert.match(at("actions"), /list of actions/);
  assert.match(at("actions/0/gas"), /another wallet/);
  assert.match(errorMessage("policy_delegate_action_mismatch"), /gas, deposit or target/);
});

test("a wallet that changed the transaction may retry; a wrong signer may not", () => {
  assert.equal(isRetryable("policy_delegate_action_mismatch"), true);
  assert.equal(isRetryable("policy_delegate_owner_mismatch"), false);
  assert.equal(isRetryable("owner_mismatch"), false);
});
