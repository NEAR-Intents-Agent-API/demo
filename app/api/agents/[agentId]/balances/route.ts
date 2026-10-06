import { NextResponse } from "next/server";
import { agentApi } from "@/lib/agent-api/client";
import { balanceQuerySchema } from "@/lib/agent-api/schemas";
import { bffError, withAgent } from "@/lib/http/handler";

export async function GET(request: Request, context: { params: Promise<{ agentId: string }> }) {
  const { agentId } = await context.params;
  return withAgent("GET /api/agents/[agentId]/balances", agentId, async ({ log }) => {
    const parsed = balanceQuerySchema.safeParse(
      Object.fromEntries(new URL(request.url).searchParams),
    );
    if (!parsed.success) return bffError("invalid_request", 400, log);
    return NextResponse.json(await agentApi().getBalances(agentId, parsed.data));
  });
}
