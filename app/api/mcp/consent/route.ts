import { z } from "zod";
import { bffError, readGuardedJson, withAgent, withSessionMutation } from "@/lib/http/handler";
import { forwardOAuthConsent, validateOAuthQuery } from "@/lib/mcp/oauth";

const schema = z.strictObject({
  accept: z.literal(false),
  agentId: z.string().min(1),
  oauthQuery: z.string().min(1).max(16384),
});
/** Acceptance is completed through the account's signed-grant authorization route. */
export function POST(request: Request) {
  return withSessionMutation(
    request,
    async () => {
      const parsed = schema.safeParse(await readGuardedJson(request));
      if (!parsed.success) return bffError("invalid_request", 400);
      return withAgent("POST MCP deny consent", parsed.data.agentId, async () => {
        await validateOAuthQuery(request, parsed.data.oauthQuery, parsed.data.agentId);
        return { redirect_uri: await forwardOAuthConsent(request, parsed.data.oauthQuery, false) };
      });
    },
    "POST MCP deny consent",
  );
}
