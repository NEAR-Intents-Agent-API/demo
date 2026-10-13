import { AgentApiError, type AgentView } from "@near-intents-agent-api/sdk";
import { NextResponse } from "next/server";
import { agentApi } from "@/lib/agent-api/client";
import { requireOwnedAgent } from "@/lib/agent-api/guard";
import { currentSession, type DemoSession } from "@/lib/auth/session";
import { guardBrowserMutation } from "@/lib/http/browser-guard";
import type { ErrorDetails } from "@/lib/http/error-details";
import { bffError, knownErrorCode, type RouteLog } from "@/lib/http/errors";
import { errorFields, logger } from "@/lib/http/logger";

export { guardBrowserMutation, readGuardedJson } from "@/lib/http/browser-guard";
export { bffError, networkGateError, type RouteLog, readJson } from "@/lib/http/errors";

/**
 * USD left in the tightest budget window, so a budget refusal can say how much the account has.
 * The refusal itself carries no amount; a failed read only means the message goes without it.
 */
async function budgetRemainingUsd(agentId: string): Promise<string | undefined> {
  try {
    const { budget } = (await agentApi().getPolicy(agentId)).usage;
    const left = [budget.daily, budget.weekly, budget.monthly]
      .map((window) => window.remaining_usd)
      .filter((remaining) => remaining !== null);
    if (left.length === 0) return undefined;
    return left.reduce((least, next) => (Number(next) < Number(least) ? next : least));
  } catch {
    return undefined;
  }
}

/**
 * Normalizes any handler failure into the demo error envelope and logs it with a request id.
 *
 * A `AgentApiError` that escapes a raw `agentApi()` call would otherwise surface as an
 * opaque 500 and lose the provider code the UI needs, so every provider call must run inside
 * `withSession` or `withAgent`.
 */
async function runLogged(
  route: string,
  handler: (log: RouteLog, session: DemoSession | null) => Promise<NextResponse | unknown>,
  agentId?: string,
): Promise<NextResponse> {
  const context: RouteLog = { requestId: crypto.randomUUID(), route, startedAt: Date.now() };
  const session = await currentSession();
  logger.debug("bff_request", { request_id: context.requestId, route, user_id: session?.userId });
  try {
    const result = await handler(context, session);
    if (result instanceof NextResponse) return result;
    return NextResponse.json(result === undefined ? { ok: true } : result);
  } catch (error) {
    if (error instanceof AgentApiError) {
      logger.warn("agent_api_error", {
        request_id: context.requestId,
        route,
        duration_ms: Date.now() - context.startedAt,
        provider_code: error.code,
        provider_status: error.status,
      });
      const details: ErrorDetails = { available_at: error.availableAt };
      if (error.code === "spend_budget_exceeded" && agentId)
        details.budget_remaining_usd = await budgetRemainingUsd(agentId);
      return bffError(error.code, error.status, context, details);
    }
    const code = knownErrorCode(error);
    if (code) return bffError(code, undefined, context);
    logger.error("bff_unhandled_error", {
      request_id: context.requestId,
      route,
      duration_ms: Date.now() - context.startedAt,
      ...errorFields(error),
    });
    return bffError("internal_error", 500, context);
  }
}

/** Session-guarded read route for handlers that do not need one agent. */
export function withSession(
  handler: (session: DemoSession, log: RouteLog) => Promise<NextResponse | unknown>,
  route: string,
): Promise<NextResponse> {
  return runLogged(route, async (log, session) => {
    if (!session) return bffError("login_required", 401, log);
    return handler(session, log);
  });
}

/**
 * Session-guarded mutation. Origin, fetch metadata, JSON content type and body size are enforced
 * before the session is resolved, so a cross-site or same-site-sibling request never reaches a
 * handler that changes state. Every mutating demo route must use this rather than `withSession`.
 */
export function withSessionMutation(
  request: Request,
  handler: (session: DemoSession, log: RouteLog) => Promise<NextResponse | unknown>,
  route: string,
  options: { maxBytes?: number } = {},
): Promise<NextResponse> {
  return runLogged(route, async (log, session) => {
    const guard = guardBrowserMutation(request, options);
    if (!guard.ok)
      return bffError(guard.reason, guard.reason === "body_too_large" ? 413 : 403, log);
    if (!session) return bffError("login_required", 401, log);
    return handler(session, log);
  });
}

/**
 * Guarded agent route: session, network gate, ownership and cross-user isolation first
 * (reusing the same decision the server components use), then normalized errors and request
 * tracing around the provider call.
 */
export async function withAgent(
  route: string,
  agentId: string,
  handler: (context: { session: DemoSession; agent: AgentView; log: RouteLog }) => Promise<unknown>,
): Promise<NextResponse> {
  const guarded = await requireOwnedAgent(agentId);
  if (!guarded.ok) return guarded.response;
  return runLogged(
    route,
    () => handler({ session: guarded.session, agent: guarded.agent, log: guarded.log }),
    agentId,
  );
}

export type AgentRouteContext = { params: Promise<{ agentId: string }> };

export function withAgentMutation(
  request: Request,
  route: string,
  agentId: string,
  handler: Parameters<typeof withAgent>[2],
): Promise<NextResponse> {
  const guard = guardBrowserMutation(request);
  if (!guard.ok)
    return Promise.resolve(bffError(guard.reason, guard.reason === "body_too_large" ? 413 : 403));
  return withAgent(route, agentId, handler);
}
