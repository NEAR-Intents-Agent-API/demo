import { NextResponse } from "next/server";
import { withFrozenFlag } from "@/lib/agent-api/agent-list";
import { agentApi } from "@/lib/agent-api/client";
import { withAgent } from "@/lib/http/handler";

export async function GET(_request: Request, context: { params: Promise<{ agentId: string }> }) {
  const { agentId } = await context.params;
  return withAgent("GET /api/agents/[agentId]", agentId, async () => {
    const api = agentApi();
    return NextResponse.json(await withFrozenFlag(api, await api.getAgent(agentId)));
  });
}
