import { oidcGrantAudience } from "@near-intents-agent-api/sdk";
import { NextResponse } from "next/server";
import { z } from "zod";
import { accessViews } from "@/lib/agent-api/access";
import { grantExpiryProblem, grantLabelProblem } from "@/lib/agent-api/access-input";
import { agentApi } from "@/lib/agent-api/client";
import { dashboardCommitments } from "@/lib/agent-api/grant-credentials";
import { ownerIntents } from "@/lib/agent-api/intents";
import { workloadCredentialSchema } from "@/lib/agent-api/schemas";
import { parseDemoEnv } from "@/lib/config/env";
import {
  type AgentRouteContext,
  bffError,
  readGuardedJson,
  withAgent,
  withAgentMutation,
} from "@/lib/http/handler";

const workloadGrantSchema = z.strictObject({
  label: z.string(),
  expiresAt: z.iso.datetime(),
  credential: workloadCredentialSchema,
});

/**
 * `GET /api/agents/[agentId]/grants`: every owner grant on the agent, by the label the owner
 * signed (the dashboard, each MCP connection, or another app). Active grants come first, then
 * the revoked and expired ones with their dates. Each active grant is revoked on its own.
 * `audience` is what a workload must request its OIDC identity token for on this agent. It is
 * built from `NEAR_INTENTS_AGENT_API_URL`, which must be the URL the API itself publishes as
 * `servers[0]` (its configured public URL), not an alias that reaches the same host.
 */
export async function GET(_request: Request, context: AgentRouteContext) {
  const { agentId } = await context.params;
  return withAgent("GET /api/agents/[agentId]/grants", agentId, async ({ session }) => {
    const [grants, dashboard] = await Promise.all([
      agentApi().listGrants(agentId),
      dashboardCommitments(session.userId, agentId),
    ]);
    return NextResponse.json({
      data: accessViews(grants, dashboard),
      audience: oidcGrantAudience(parseDemoEnv().NEAR_INTENTS_AGENT_API_URL, agentId),
    });
  });
}

/**
 * `POST`: prepares a grant bound to a workload (an OIDC identity or a public key) for the owner
 * to sign. The dashboard holds nothing for it: the workload keeps its own identity token or
 * private key, so there is no token to store, unlike the dashboard's and MCP clients' grants. The
 * API fills in an OIDC grant's audience; the credential is checked here for shape and by the API
 * in full.
 */
export async function POST(request: Request, context: AgentRouteContext) {
  const { agentId } = await context.params;
  return withAgentMutation(request, "POST grants", agentId, async ({ session, log }) => {
    const parsed = workloadGrantSchema.safeParse(await readGuardedJson(request));
    if (!parsed.success) return bffError("validation_failed", 400, log);
    const label = parsed.data.label.trim();
    const expiresAt = Date.parse(parsed.data.expiresAt);
    if (grantLabelProblem(label) || grantExpiryProblem(expiresAt, Date.now()))
      return bffError("validation_failed", 400, log);
    return ownerIntents().generate(session.userId, {
      type: "grant_issue",
      agent_id: agentId,
      label,
      credential: parsed.data.credential,
      expires_at: new Date(expiresAt).toISOString(),
    });
  });
}
