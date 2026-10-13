import type { AgentApi, AgentView } from "@near-intents-agent-api/sdk";
import { agentBelongsToUser } from "./ownership";

/** An owned agent plus the one fact the list endpoint does not carry: is it frozen. */
export type AgentListItem = AgentView & { frozen: boolean };

/** Upper bounds: a loop guard on the cursor and a polite cap on parallel policy reads. */
const MAX_PAGES = 50;
const POLICY_READ_CONCURRENCY = 8;

/**
 * Every agent the signed-in user owns, with its frozen flag.
 *
 * The list endpoint is cursor-paged and has no frozen field, so the pages are followed to the
 * end and each live account's policy is read (a few at a time) for it. Only ACTIVE accounts can
 * be frozen; a failed read fails the whole list rather than showing a frozen account as live.
 */
export async function listOwnedAgents(
  api: Pick<AgentApi, "listAgents" | "getPolicy">,
  userId: string,
): Promise<AgentListItem[]> {
  const owned: AgentView[] = [];
  let cursor: string | undefined;
  for (let page = 0; page < MAX_PAGES; page += 1) {
    const { data, next_cursor } = await api.listAgents({
      external_user_id: userId,
      ...(cursor ? { cursor } : {}),
    });
    owned.push(...data.filter((agent) => agentBelongsToUser(agent, userId)));
    if (!next_cursor) break;
    cursor = next_cursor;
  }
  return mapWithConcurrency(owned, POLICY_READ_CONCURRENCY, async (agent) => ({
    ...agent,
    frozen:
      agent.status === "ACTIVE" ? Boolean((await api.getPolicy(agent.id)).policy?.frozen) : false,
  }));
}

/** `Array.map` with an async callback and at most `limit` calls in flight; order is kept. */
async function mapWithConcurrency<T, R>(
  items: readonly T[],
  limit: number,
  run: (item: T) => Promise<R>,
): Promise<R[]> {
  const results = new Array<R>(items.length);
  let next = 0;
  async function worker() {
    while (next < items.length) {
      const index = next;
      next += 1;
      results[index] = await run(items[index] as T);
    }
  }
  await Promise.all(Array.from({ length: Math.min(limit, items.length) }, worker));
  return results;
}
