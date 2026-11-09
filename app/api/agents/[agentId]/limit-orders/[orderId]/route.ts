import { NextResponse } from "next/server";
import { agentApi } from "@/lib/agent-api/client";
import { withAgent } from "@/lib/http/handler";

/** `GET /api/agents/[agentId]/limit-orders/[orderId]`: one order, live from the provider. */
export async function GET(
  _request: Request,
  context: { params: Promise<{ agentId: string; orderId: string }> },
) {
  const { agentId, orderId } = await context.params;
  return withAgent("GET /api/agents/[agentId]/limit-orders/[orderId]", agentId, async () =>
    NextResponse.json(await agentApi().getLimitOrder(agentId, orderId)),
  );
}
