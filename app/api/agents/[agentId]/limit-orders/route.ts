import { NextResponse } from "next/server";
import { agentApi } from "@/lib/agent-api/client";
import { limitOrderQuerySchema } from "@/lib/agent-api/schemas";
import { bffError, withAgent } from "@/lib/http/handler";

/**
 * `GET /api/agents/[agentId]/limit-orders`
 *
 * The account's limit orders as the provider lists them, newest first. Placing and cancelling go
 * through the funds route like every other money move.
 */
export async function GET(request: Request, context: { params: Promise<{ agentId: string }> }) {
  const { agentId } = await context.params;
  return withAgent("GET /api/agents/[agentId]/limit-orders", agentId, async ({ log }) => {
    const parsed = limitOrderQuerySchema.safeParse(
      Object.fromEntries(new URL(request.url).searchParams),
    );
    if (!parsed.success) return bffError("validation_failed", 400, log);
    return NextResponse.json(await agentApi().listLimitOrders(agentId, parsed.data));
  });
}
