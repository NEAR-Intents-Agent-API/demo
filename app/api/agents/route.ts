import { z } from "zod";
import { listOwnedAgents } from "@/lib/agent-api/agent-list";
import { agentApi } from "@/lib/agent-api/client";
import { ownerIntents } from "@/lib/agent-api/intents";
import { requireConfiguredNetwork } from "@/lib/agent-api/network";
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
 * from an unreachable or wrong-network API, and the result is filtered again in-process. Every
 * page is followed. `?frozen=1` also reads each live account's frozen flag (see
 * `listOwnedAgents`); without it the flag is unknown, so shared chrome costs no policy reads.
 */
export function GET(request: Request) {
  const withFrozen = new URL(request.url).searchParams.get("frozen") === "1";
  return withSession(async (session) => {
    const gate = await requireConfiguredNetwork();
    if (!gate.ok) return networkGateError(gate, { route: "GET /api/agents" });
    return {
      agents: await listOwnedAgents(agentApi(), session.userId, { frozen: withFrozen }),
    };
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
      if (!parsed.success) return bffError("validation_failed", 400);
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
