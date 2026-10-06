import assert from "node:assert/strict";
import { test } from "node:test";
import { errorMessage, errorMessages, isRetryable } from "../../lib/http/messages";

/**
 * The demo shows known provider error codes, but it also decides whether to offer a
 * retry. That decision is user-visible: a retry button on a state error teaches a visitor to
 * press it forever, so the boundary between "try again" and "this is a fact" is pinned here.
 */

test("every documented code has human text, and none of it is the code itself", () => {
  for (const [code, message] of Object.entries(errorMessages)) {
    assert.ok(message.length > 0, `${code} has a message`);
    assert.notEqual(message, code, `${code} does not fall back to itself`);
  }
});

test("unknown codes and inherited object keys use a safe message", () => {
  assert.equal(errorMessage("private_provider_detail"), errorMessages.request_failed);
  assert.equal(errorMessage("__proto__"), errorMessages.request_failed);
});

test("state errors are not retryable, so no dead-end retry button appears", () => {
  assert.equal(isRetryable("agent_not_bound"), false);
  assert.equal(isRetryable("agent_not_found"), false);
  assert.equal(isRetryable("policy_revision_conflict"), false);
  assert.equal(isRetryable("intent_expired"), false);
  assert.equal(isRetryable("owner_approval_unsupported"), false);
  assert.equal(errorMessage("policy_not_ready"), errorMessages.policy_not_ready);
  assert.equal(isRetryable("onboarding_expired"), false);
});

test("transient failures are retryable", () => {
  assert.equal(isRetryable("agent_api_unreachable"), true);
  assert.equal(isRetryable("provider_unavailable"), true);
  assert.equal(isRetryable("provider_rate_limited"), true);
  assert.equal(isRetryable("onboarding_confirmation_timeout"), true);
});

test("unknown codes default to retryable rather than to a dead end", () => {
  assert.equal(isRetryable("some_new_provider_code"), true);
});
