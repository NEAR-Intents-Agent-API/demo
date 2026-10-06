import { and, desc, eq } from "drizzle-orm";
import { getDemoDatabase } from "@/lib/auth/instance";
import type { DemoDatabase } from "@/lib/db/client";
import { mcpActivity } from "@/lib/db/schema";

export type McpActivityInput = Omit<typeof mcpActivity.$inferInsert, "id" | "createdAt">;
export type McpActivityView = Omit<typeof mcpActivity.$inferSelect, "createdAt" | "userId"> & {
  createdAt: string;
};

export async function recordMcpActivity(
  input: McpActivityInput,
  database: DemoDatabase = getDemoDatabase(),
): Promise<void> {
  try {
    await database.db.insert(mcpActivity).values({ id: crypto.randomUUID(), ...input });
  } catch {
    /* Diagnostic history must never change a tool outcome. */
  }
}

export async function listAgentMcpActivity(
  userId: string,
  agentId: string,
  limit = 50,
  database: DemoDatabase = getDemoDatabase(),
): Promise<McpActivityView[]> {
  const rows = await database.db
    .select()
    .from(mcpActivity)
    .where(and(eq(mcpActivity.userId, userId), eq(mcpActivity.agentId, agentId)))
    .orderBy(desc(mcpActivity.createdAt))
    .limit(Math.min(Math.max(limit, 1), 100));
  return rows.map(({ userId: _userId, createdAt, ...row }) => ({
    ...row,
    createdAt: createdAt.toISOString(),
  }));
}
