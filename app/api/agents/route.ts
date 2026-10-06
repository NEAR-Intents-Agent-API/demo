import { z } from "zod";
import { agentApi } from "@/lib/agent-api/client";
import { ownerIntents } from "@/lib/agent-api/intents";
import { requireConfiguredNetwork } from "@/lib/agent-api/network";
import { agentBelongsToUser } from "@/lib/agent-api/ownership";
import { policySchema } from "@/lib/agent-api/schemas";
import { demoOwnerForSession } from "@/lib/auth/owner-session";
import {
  bffError,
  networkGateError,
  readGuardedJson,
  withSession,
  withSessionMutation,
} from "@/lib/http/handler";

/**
 * `GET /api/agents`: agents owned by the signed-in demo user only.
 *
 * The network gate runs first so a mainnet demo fails closed before returning any agent data
 * from an unreachable or wrong-network API, and the result is filtered again in-process.
 */
export function GET() {
  return withSession(async (session) => {
    const gate = await requireConfiguredNetwork();
    if (!gate.ok) return networkGateError(gate, { route: "GET /api/agents" });
    const { data: agents } = await agentApi().listAgents({ external_user_id: session.userId });
    return { agents: agents.filter((agent) => agentBelongsToUser(agent, session.userId)) };
  }, "GET /api/agents");
}

/** Browser input for `agent_create`; the owner and external user come from the session. */
const createInputSchema = z.strictObject({
  name: z.string().trim().min(1).max(100),
  policy: policySchema,
});

/**
 * `POST /api/agents`: creates a pending agent for the signed-in owner with its first policy.
 *
 * The owner is always the identity this session authenticated with, never a browser-supplied
 * one. The response carries the single request the owner signs to make the agent live.
 */
export function POST(request: Request) {
  return withSessionMutation(
    request,
    async (session) => {
      const gate = await requireConfiguredNetwork();
      if (!gate.ok) return networkGateError(gate, { route: "POST /api/agents" });
      const parsed = createInputSchema.safeParse(await readGuardedJson(request));
      if (!parsed.success) return bffError("invalid_request", 400);
      const owner = await demoOwnerForSession(session);
      if (!owner) return bffError("owner_identity_missing", 409);
      return ownerIntents().generate(session.userId, {
        type: "agent_create",
        name: parsed.data.name,
        external_user_id: session.userId,
        owner,
        policy: parsed.data.policy,
      });
    },
    "POST /api/agents",
  );
}
