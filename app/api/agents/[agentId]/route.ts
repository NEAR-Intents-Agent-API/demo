import { NextResponse } from "next/server";
import { agentApi } from "@/lib/agent-api/client";
import { withAgent } from "@/lib/http/handler";

export async function GET(_request: Request, context: { params: Promise<{ agentId: string }> }) {
  const { agentId } = await context.params;
  return withAgent("GET /api/agents/[agentId]", agentId, async () =>
    NextResponse.json(await agentApi().getAgent(agentId)),
  );
}
