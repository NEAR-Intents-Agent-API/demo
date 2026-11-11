import { NextResponse } from "next/server";
import { verifyAgentReceipt } from "@/lib/agent-api/receipt-verify";
import { withAgent } from "@/lib/http/handler";

/** Checks the receipt against the pinned transparency log here, so the browser trusts this server, not the API. */
export async function GET(
  _request: Request,
  context: { params: Promise<{ agentId: string; correlationId: string }> },
) {
  const { agentId, correlationId } = await context.params;
  return withAgent(
    "GET /api/agents/[agentId]/receipts/[correlationId]/verification",
    agentId,
    async () => NextResponse.json(await verifyAgentReceipt(agentId, correlationId)),
  );
}
