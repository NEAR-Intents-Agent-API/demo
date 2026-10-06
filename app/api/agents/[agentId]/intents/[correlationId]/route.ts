import { z } from "zod";
import { ownerIntents } from "@/lib/agent-api/intents";
import { signedDataSchema } from "@/lib/agent-api/schemas";
import { bffError, readGuardedJson, withAgentMutation } from "@/lib/http/handler";
export async function POST(
  request: Request,
  context: { params: Promise<{ agentId: string; correlationId: string }> },
) {
  const { agentId, correlationId } = await context.params;
  return withAgentMutation(request, "POST submit-intent", agentId, async ({ session }) => {
    const parsed = z
      .strictObject({ signedData: signedDataSchema })
      .safeParse(await readGuardedJson(request));
    if (!parsed.success) return bffError("invalid_request", 400);
    return ownerIntents().submit(session.userId, agentId, correlationId, parsed.data.signedData);
  });
}
