import { NextResponse } from "next/server";
import { agentApi } from "@/lib/agent-api/client";
import { withAgent } from "@/lib/http/handler";

/**
 * `GET /api/agents/[agentId]/operations/[operationId]`
 *
 * Reads one persisted operation. Dashboard activity and MCP polls resolve the
 * same local operation record, and provider evidence stays in `result` rather than being
 * summarized into a settlement claim.
 */
export async function GET(
  request: Request,
  context: { params: Promise<{ agentId: string; operationId: string }> },
) {
  const { agentId, operationId } = await context.params;
  const query = new URL(request.url).searchParams;
  const requestedWait = Number(query.get("wait_ms") ?? "0");
  // The provider long-polls at most 30s; a caller cannot turn one read into an unbounded wait.
  const waitMs = Number.isFinite(requestedWait) ? Math.min(Math.max(requestedWait, 0), 30_000) : 0;
  return withAgent("GET /api/agents/[agentId]/operations/[operationId]", agentId, async () =>
    agentApi()
      .getStatus(operationId, {
        refresh: query.get("refresh") === "true" || waitMs > 0,
        waitMs,
      })
      .then((status) =>
        status.agent_id === agentId
          ? NextResponse.json(status)
          : NextResponse.json({ error: { code: "operation_not_found" } }, { status: 404 }),
      ),
  );
}
