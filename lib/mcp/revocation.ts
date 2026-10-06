import type { SignedData } from "@near-intents-agent-api/sdk";
import { and, eq, sql } from "drizzle-orm";
import { agentApi } from "@/lib/agent-api/client";
import { createOwnerIntents, ownerIntents } from "@/lib/agent-api/intents";
import { issuedGrantSchema, terminalStatuses } from "@/lib/agent-api/schemas";
import { getDemoDatabase } from "@/lib/auth/instance";
import { mcpClientAccess } from "@/lib/db/schema";
import {
  blockClient,
  findClientAccess,
  type McpClientAccess,
  ownedClient,
} from "@/lib/mcp/clients";

export async function revokeClient(
  userId: string,
  agentId: string,
  id: string,
  signedData?: SignedData,
) {
  const database = getDemoDatabase();
  const access = await ownedClient(userId, agentId, id);
  await blockClient(access);
  access.grantId = await reconcileInstallation(access);
  if (!access.grantId) return { revoked: true, generated: null, operation: null, submitted: false };
  const grant = (await agentApi().listGrants(agentId)).find(
    (entry) => entry.grant_id === access.grantId,
  );
  if (!grant || grant.revoked_at)
    return { revoked: true, generated: null, operation: null, submitted: false };
  access.revokeCorrelationId = await prepareRevocation(access);
  const before = await ownerIntents().submit(userId, agentId, access.revokeCorrelationId);
  let step = before;
  if (before.operation.status === "PENDING_SIGNATURE" && signedData) {
    const [reserved] = await database.db
      .update(mcpClientAccess)
      .set({ revokeSubmitted: true })
      .where(and(eq(mcpClientAccess.id, id), eq(mcpClientAccess.revokeSubmitted, false)))
      .returning();
    if (reserved)
      step = await ownerIntents().submit(userId, agentId, access.revokeCorrelationId, signedData);
  }
  return {
    revoked: step.operation.status === "SUCCESS",
    ...step,
    submitted: (await findClientAccess(id))?.revokeSubmitted ?? false,
  };
}

/** Observe a potentially accepted grant before asking the owner to revoke it. */
async function reconcileInstallation(access: McpClientAccess) {
  if (access.grantId || !access.grantCorrelationId || !access.grantSubmitted) return access.grantId;
  const installed = await ownerIntents().submit(
    access.userId,
    access.agentId,
    access.grantCorrelationId,
  );
  if (installed.operation.status !== "SUCCESS") {
    if (!terminalStatuses.includes(installed.operation.status))
      throw new Error("grant_authorization_pending");
    await getDemoDatabase()
      .db.update(mcpClientAccess)
      .set({ grantSubmitted: false })
      .where(eq(mcpClientAccess.id, access.id));
    return null;
  }
  if (installed.operation.type !== "grant_issue" || !("grant" in installed.operation.details))
    throw new Error("grant_install_failed");
  return issuedGrantSchema.parse(installed.operation.details.grant).grant_id;
}

/** A proven terminal failure permits a fresh signing request; uncertain outcomes only reconcile. */
async function prepareRevocation(access: McpClientAccess) {
  const database = getDemoDatabase();
  const { userId, agentId, id } = access;
  if (access.revokeCorrelationId) {
    const previous = await ownerIntents().submit(userId, agentId, access.revokeCorrelationId);
    if (
      previous.operation.status !== "SUCCESS" &&
      terminalStatuses.includes(previous.operation.status)
    ) {
      await database.db
        .update(mcpClientAccess)
        .set({ revokeCorrelationId: null, revokeSubmitted: false })
        .where(
          and(
            eq(mcpClientAccess.id, id),
            eq(mcpClientAccess.revokeCorrelationId, access.revokeCorrelationId),
          ),
        );
      access.revokeCorrelationId = (await findClientAccess(id))?.revokeCorrelationId ?? null;
    }
  }
  if (!access.revokeCorrelationId) {
    const step = await database.db.transaction(async (transaction) => {
      const scoped = { ...database, db: transaction as unknown as typeof database.db };
      await transaction.execute(
        sql`select "id" from "mcpClientAccess" where "id" = ${id} for update`,
      );
      const current = await findClientAccess(id, scoped);
      if (current?.revokeCorrelationId)
        return createOwnerIntents(scoped, agentApi()).submit(
          userId,
          agentId,
          current.revokeCorrelationId,
        );
      const prepared = await createOwnerIntents(scoped, agentApi()).generate(userId, {
        type: "grant_revoke",
        agent_id: agentId,
        grant_id: access.grantId as string,
      });
      await transaction
        .update(mcpClientAccess)
        .set({ grantId: access.grantId, revokeCorrelationId: prepared.generated.correlation_id })
        .where(eq(mcpClientAccess.id, id));
      return prepared;
    });
    access.revokeCorrelationId = step.generated.correlation_id;
  }
  return access.revokeCorrelationId as string;
}
