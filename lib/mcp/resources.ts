import { eq } from "drizzle-orm";
import { getDemoDatabase } from "@/lib/auth/instance";
import type { DemoDatabase } from "@/lib/db/client";
import { oauthResource } from "@/lib/db/schema";
import { AGENT_SCOPE, agentResourceUrl } from "@/lib/mcp/config";

export async function ensureAgentResource(
  agentId: string,
  database: DemoDatabase = getDemoDatabase(),
): Promise<void> {
  await database.db
    .insert(oauthResource)
    .values({
      id: crypto.randomUUID(),
      identifier: await agentResourceUrl(agentId),
      name: `Agent ${agentId.slice(0, 12)}`,
      allowedScopes: [AGENT_SCOPE],
      dpopBoundAccessTokensRequired: false,
      disabled: false,
      policyVersion: 1,
    })
    .onConflictDoNothing({ target: oauthResource.identifier });
}

export async function agentResourceExists(
  agentId: string,
  database: DemoDatabase = getDemoDatabase(),
): Promise<boolean> {
  const [row] = await database.db
    .select()
    .from(oauthResource)
    .where(eq(oauthResource.identifier, await agentResourceUrl(agentId)))
    .limit(1);
  return Boolean(row && !row.disabled);
}
