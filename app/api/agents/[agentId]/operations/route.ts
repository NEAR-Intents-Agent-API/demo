import type { AgentApi } from "@near-intents-agent-api/sdk";
import { NextResponse } from "next/server";
import { agentApi } from "@/lib/agent-api/client";
import { withAgent } from "@/lib/http/handler";

/** The API's page maximum: the activity feed joins up to 50 client requests against this list. */
const HISTORY_LIMIT = 100;

// TODO(sdk-typescript#14): SDK 0.5.0's `getHistory` query type has no `include_unpaid` (it forwards
// every query key at runtime). Drop this type and pass the object inline once the SDK bump lands.
type HistoryQuery = NonNullable<Parameters<AgentApi["getHistory"]>[1]> & {
  include_unpaid?: boolean;
};

/** Deposit addresses nothing was paid into yet stay listed, so their rows don't vanish from the feed. */
const HISTORY_QUERY: HistoryQuery = { limit: HISTORY_LIMIT, include_unpaid: true };

export async function GET(_request: Request, context: { params: Promise<{ agentId: string }> }) {
  const { agentId } = await context.params;
  return withAgent("GET /api/agents/[agentId]/operations", agentId, async () =>
    NextResponse.json(await agentApi().getHistory(agentId, HISTORY_QUERY)),
  );
}
