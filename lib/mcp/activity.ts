import { AgentApiError } from "@near-intents-agent-api/sdk";
import { and, desc, eq } from "drizzle-orm";
import { getDemoDatabase } from "@/lib/auth/instance";
import type { DemoDatabase } from "@/lib/db/client";
import { mcpActivity } from "@/lib/db/schema";
import { ToolDeniedError } from "@/lib/mcp/tools";

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

/** A refusal that names a rule or a bad input: our own denial, or a provider 4xx that is not a rate limit. */
export function isLoggedRefusal(error: unknown): error is AgentApiError | ToolDeniedError {
  if (error instanceof ToolDeniedError) return true;
  return (
    error instanceof AgentApiError &&
    error.status >= 400 &&
    error.status < 500 &&
    error.status !== 429
  );
}

/**
 * A refused attempt from the dashboard's own Wallet screen, logged beside the client requests so
 * the owner can see it happened. Quotes and previews move nothing and are not logged; only a
 * policy or validation refusal is (a 5xx, a rate limit or a network failure carries no rule to
 * show, and the same request is simply retried).
 */
export async function recordDashboardRefusal(
  input: { userId: string; agentId: string; tool: string; error: unknown },
  database: DemoDatabase = getDemoDatabase(),
): Promise<void> {
  const { userId, agentId, tool, error } = input;
  if (tool.endsWith("_quote") || tool.endsWith("_preview")) return;
  if (!isLoggedRefusal(error)) return;
  await recordMcpActivity(
    {
      clientAccessId: null,
      clientName: "Dashboard",
      agentId,
      userId,
      authKind: "dashboard",
      subject: userId,
      tool,
      status: "error",
      detail: error.code,
    },
    database,
  );
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
