import { z } from "zod";
import { signedDataSchema } from "@/lib/agent-api/schemas";
import { bffError, readGuardedJson, withAgentMutation } from "@/lib/http/handler";
import { revokeClient } from "@/lib/mcp/revocation";

const schema = z.strictObject({ signedData: signedDataSchema.optional() });
export async function POST(
  request: Request,
  context: { params: Promise<{ agentId: string; clientAccessId: string }> },
) {
  const { agentId, clientAccessId } = await context.params;
  return withAgentMutation(request, "POST MCP revoke client", agentId, async ({ session }) => {
    const parsed = schema.safeParse(await readGuardedJson(request));
    if (!parsed.success) return bffError("invalid_request", 400);
    return revokeClient(session.userId, agentId, clientAccessId, parsed.data.signedData);
  });
}
