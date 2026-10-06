import { NextResponse } from "next/server";
import { z } from "zod";
import { accessView } from "@/lib/agent-api/access";
import { agentApi } from "@/lib/agent-api/client";
import { heldGrant, prepareGrantCredential } from "@/lib/agent-api/grant-credentials";
import { ownerIntents } from "@/lib/agent-api/intents";
import {
  type AgentRouteContext,
  bffError,
  readGuardedJson,
  withAgent,
  withAgentMutation,
} from "@/lib/http/handler";

const DAY_MS = 24 * 60 * 60 * 1000;

const enableSchema = z.strictObject({
  days: z.union([z.literal(1), z.literal(7), z.literal(30)]),
});

/** The dashboard's live owner grant behind "move funds from here", or null when none is signed. */
export async function GET(_request: Request, context: AgentRouteContext) {
  const { agentId } = await context.params;
  return withAgent("GET /api/agents/[agentId]/access", agentId, async ({ session }) => {
    const held = await heldGrant(agentApi(), {
      userId: session.userId,
      agentId,
      holder: "dashboard",
    });
    return NextResponse.json({ access: held ? accessView(held.grant) : null });
  });
}

/**
 * `POST`: prepares the grant the owner signs to let the dashboard act on the account. A grant
 * only names who may act; what it may do is the account policy, shared with every MCP connection.
 * The browser chooses only its duration. It is the dashboard's own grant with its own token: MCP
 * connections keep theirs.
 */
export async function POST(request: Request, context: AgentRouteContext) {
  const { agentId } = await context.params;
  return withAgentMutation(request, "POST access", agentId, async ({ session, log }) => {
    const parsed = enableSchema.safeParse(await readGuardedJson(request));
    if (!parsed.success) return bffError("invalid_request", 400, log);
    const credential = await prepareGrantCredential({
      userId: session.userId,
      agentId,
      holder: "dashboard",
      label: "Dashboard",
    });
    return ownerIntents().generate(session.userId, {
      type: "grant_issue",
      agent_id: agentId,
      label: credential.label,
      credential: credential.commitment,
      expires_at: new Date(Date.now() + parsed.data.days * DAY_MS).toISOString(),
    });
  });
}

/** `DELETE`: prepares the revocation of the dashboard's grant, for the owner to sign. */
export async function DELETE(request: Request, context: AgentRouteContext) {
  const { agentId } = await context.params;
  return withAgentMutation(request, "DELETE access", agentId, async ({ session, log }) => {
    const held = await heldGrant(agentApi(), {
      userId: session.userId,
      agentId,
      holder: "dashboard",
    });
    if (!held) return bffError("not_found", 404, log);
    return ownerIntents().generate(session.userId, {
      type: "grant_revoke",
      agent_id: agentId,
      grant_id: held.grant.grant_id,
    });
  });
}
