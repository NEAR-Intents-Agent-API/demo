import { NextResponse } from "next/server";
import type { NetworkGateFailure } from "@/lib/agent-api/network";
import { readGuardedJson } from "@/lib/http/browser-guard";
import { logger } from "@/lib/http/logger";

const errorStatus: Record<string, number> = {
  invalid_request: 400,
  login_required: 401,
  owner_proof_invalid: 401,
  owner_key_not_full_access: 403,
  agent_not_found: 404,
  not_found: 404,
  approval_not_found: 404,
  operation_not_found: 404,
  agent_api_unreachable: 503,
  network_mismatch: 503,
  wallet_network_unsupported: 409,
  policy_update_disabled: 503,
  provider_unavailable: 503,
  agent_not_bound: 409,
  agent_not_available: 409,
  agent_archived: 409,
  agent_deleted: 409,
  wallet_frozen: 409,
  owner_activation_uncertain: 409,
  owner_activation_pending: 409,
  owner_already_bound: 409,
  owner_identity_missing: 409,
  owner_nonce_invalid: 409,
  owner_counter_conflict: 409,
  policy_workflow_not_found: 404,
  policy_workflow_conflict: 409,
  policy_revision_conflict: 409,
  policy_submission_unconfirmed: 409,
  policy_submission_uncertain: 409,
  provider_policy_mismatch: 409,
  wallet_not_provisioned: 409,
  wallet_not_active: 409,
  wallet_provisioning_uncertain: 409,
  wallet_provisioning_failed: 502,
  approval_closed: 409,
  approval_changed: 409,
  approval_challenge_invalid: 409,
  policy_not_ready: 409,
  policy_denied: 409,
  operation_kind_mismatch: 409,
  key_not_found: 404,
  resource_not_found: 404,
  client_not_found: 404,
  client_revoked: 403,
  client_already_authorized: 409,
  client_access_conflict: 409,
  oauth_query_invalid: 400,
  consent_failed: 409,
  grant_challenge_invalid: 409,
  grant_install_failed: 409,
  grant_authorization_pending: 409,
  mcp_key_invalid: 401,
  access_required: 409,
  policy_destination_denied: 403,
  provider_refused: 409,
  provider_rate_limited: 429,
  spend_budget_exceeded: 403,
  spend_price_unavailable: 503,
  idle: 409,
  internal_error: 500,
  body_too_large: 413,
};

export function knownErrorCode(error: unknown): string | null {
  if (!(error instanceof Error)) return null;
  return Object.hasOwn(errorStatus, error.message) ? error.message : null;
}

export type RouteLog = { requestId: string; route: string; startedAt: number };

/**
 * JSON error body for the demo BFF. Unknown codes default to 502 because an unrecognized
 * failure came from upstream, not from the browser. Provider internals and credentials never
 * leak.
 */
export function bffError(code: string, status?: number, context: Partial<RouteLog> = {}) {
  const resolved = status ?? errorStatus[code] ?? 502;
  logger[resolved >= 500 ? "error" : "warn"]("bff_error", {
    request_id: context.requestId,
    route: context.route,
    code,
    status: resolved,
  });
  return NextResponse.json(
    { error: { code } },
    {
      status: resolved,
      headers: context.requestId ? { "x-request-id": context.requestId } : undefined,
    },
  );
}

/** Fail-closed response for a failed network gate, preserving the reason code. */
export function networkGateError(failure: NetworkGateFailure, context: Partial<RouteLog> = {}) {
  return bffError(failure.reason, 503, context);
}

export async function readJson(request: Request): Promise<unknown> {
  return readGuardedJson(request);
}
