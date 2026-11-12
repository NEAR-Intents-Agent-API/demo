import { NextResponse } from "next/server";
import { agentApi } from "@/lib/agent-api/client";
import { withAgent } from "@/lib/http/handler";

const PAGE_SIZE = 25;

/** One page of settled executions, newest first; `cursor` is the previous page's `next_cursor`. */
export async function GET(request: Request, context: { params: Promise<{ agentId: string }> }) {
  const { agentId } = await context.params;
  const cursor = new URL(request.url).searchParams.get("cursor") ?? undefined;
  return withAgent("GET /api/agents/[agentId]/receipts", agentId, async () =>
    NextResponse.json(await agentApi().listReceipts(agentId, { limit: PAGE_SIZE, cursor })),
  );
}
