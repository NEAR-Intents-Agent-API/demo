import { z } from "zod";
import { ownerIntents } from "@/lib/agent-api/intents";
import { signedDataSchema } from "@/lib/agent-api/schemas";
import { bffError, readJson, withAgentMutation } from "@/lib/http/handler";

const inputSchema = z.strictObject({ signedData: signedDataSchema.optional() });
export async function POST(
  request: Request,
  context: { params: Promise<{ agentId: string; workflowId: string }> },
) {
  const { agentId, workflowId } = await context.params;
  return withAgentMutation(request, "POST policy/workflow", agentId, async ({ session, log }) => {
    const input = inputSchema.safeParse(await readJson(request));
    if (!input.success) return bffError("invalid_request", 400, log);
    return ownerIntents().submit(session.userId, agentId, workflowId, input.data.signedData);
  });
}
