import type { AgentApi, GenerateIntentRequest, SignedData } from "@near-intents-agent-api/sdk";
import { and, desc, eq } from "drizzle-orm";
import { agentApi } from "@/lib/agent-api/client";
import { getDemoDatabase } from "@/lib/auth/instance";
import type { DemoDatabase } from "@/lib/db/client";
import { ownerIntent } from "@/lib/db/schema";
import { ensureAgentResource } from "@/lib/mcp/resources";

/** Options for reads that only observe status. `waitMs` long-polls the Agent API (at most 30 000). */
export type ObserveOptions = { waitMs?: number };

export function createOwnerIntents(database: DemoDatabase, api: AgentApi) {
  async function generate(userId: string, request: GenerateIntentRequest) {
    const generated = await api.generateIntent(request);
    await database.db.insert(ownerIntent).values({
      correlationId: generated.correlation_id,
      userId,
      agentId: generated.agent_id,
      type: generated.type,
      generated,
    });
    return { generated, operation: await api.getStatus(generated.correlation_id) };
  }
  async function owned(userId: string, agentId: string, correlationId: string) {
    const [row] = await database.db
      .select()
      .from(ownerIntent)
      .where(
        and(
          eq(ownerIntent.correlationId, correlationId),
          eq(ownerIntent.userId, userId),
          eq(ownerIntent.agentId, agentId),
        ),
      );
    if (!row) throw new Error("intent_not_found");
    return row;
  }
  async function submit(
    userId: string,
    agentId: string,
    correlationId: string,
    signedData?: SignedData,
    options: ObserveOptions = {},
  ) {
    const row = await owned(userId, agentId, correlationId);
    const operation = signedData
      ? await api.submitIntent({
          type: row.generated.type,
          correlation_id: correlationId,
          signed_data: signedData,
        })
      : await api.getStatus(correlationId, options);
    if (row.generated.type === "agent_create" && operation.status === "SUCCESS")
      await ensureAgentResource(agentId, database);
    return { generated: row.generated, operation };
  }
  async function latest(
    userId: string,
    agentId: string,
    type: GenerateIntentRequest["type"],
    options: ObserveOptions = {},
  ) {
    const [row] = await database.db
      .select()
      .from(ownerIntent)
      .where(
        and(
          eq(ownerIntent.userId, userId),
          eq(ownerIntent.agentId, agentId),
          eq(ownerIntent.type, type),
        ),
      )
      .orderBy(desc(ownerIntent.createdAt))
      .limit(1);
    return row ? submit(userId, agentId, row.correlationId, undefined, options) : null;
  }
  return { generate, submit, latest };
}
export const ownerIntents = () => createOwnerIntents(getDemoDatabase(), agentApi());
