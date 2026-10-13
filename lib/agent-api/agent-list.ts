import type { AgentApi, AgentView } from "@near-intents-agent-api/sdk";
import { agentBelongsToUser } from "./ownership";

/**
 * An owned agent plus the one fact the list endpoint does not carry: is it frozen. `null` means
 * unknown (not read, or the read failed), which no screen may present as either state.
 */
export type AgentListItem = AgentView & { frozen: boolean | null };

/** Upper bounds: a loop guard on the cursor and a polite cap on parallel policy reads. */
const MAX_PAGES = 50;
const POLICY_READ_CONCURRENCY = 8;

/**
 * Every agent the signed-in user owns.
 *
 * The list endpoint is cursor-paged and has no frozen field, so the pages are followed to the
 * end. With `frozen`, each live account's applied policy is also read (a few at a time) for its
 * flag; without it the flag stays unknown and no policy is read.
 */
export async function listOwnedAgents(
  api: Pick<AgentApi, "listAgents" | "getPolicy">,
  userId: string,
  { frozen = false }: { frozen?: boolean } = {},
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
  if (!frozen) return owned.map(withoutFrozenFlag);
  return mapWithConcurrency(owned, POLICY_READ_CONCURRENCY, (agent) => withFrozenFlag(api, agent));
}

/** Only an ACTIVE account can be frozen; for any other the flag is simply false. */
export function withoutFrozenFlag(agent: AgentView): AgentListItem {
  return { ...agent, frozen: agent.status === "ACTIVE" ? null : false };
}

/**
 * One agent with its frozen flag, read from the APPLIED policy only: a signed or failed
 * revision is not in force. Best effort: a failed read leaves the flag unknown rather than
 * failing the account or guessing.
 */
export async function withFrozenFlag(
  api: Pick<AgentApi, "getPolicy">,
  agent: AgentView,
): Promise<AgentListItem> {
  if (agent.status !== "ACTIVE") return { ...agent, frozen: false };
  try {
    const view = await api.getPolicy(agent.id);
    return { ...agent, frozen: view.status === "APPLIED" ? (view.policy?.frozen ?? null) : null };
  } catch {
    return { ...agent, frozen: null };
  }
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
