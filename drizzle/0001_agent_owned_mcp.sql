CREATE TABLE "mcpActivity" (
	"id" text PRIMARY KEY NOT NULL,
	"clientAccessId" text,
	"clientName" text NOT NULL,
	"agentId" text NOT NULL,
	"userId" text NOT NULL,
	"authKind" text NOT NULL,
	"subject" text NOT NULL,
	"tool" text NOT NULL,
	"status" text NOT NULL,
	"operationId" text,
	"detail" text,
	"createdAt" timestamp with time zone DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "mcpClientAccess" (
	"id" text PRIMARY KEY NOT NULL,
	"userId" text NOT NULL,
	"agentId" text NOT NULL,
	"name" text NOT NULL,
	"authKind" text NOT NULL,
	"oauthClientId" text,
	"status" text DEFAULT 'pending' NOT NULL,
	"tokenHash" text,
	"prefix" text,
	"expiresAt" timestamp with time zone,
	"lastUsedAt" timestamp with time zone,
	"grantId" text,
	"grantCorrelationId" text,
	"grantSubmitted" boolean DEFAULT false NOT NULL,
	"oauthQueryHash" text,
	"revokeCorrelationId" text,
	"revokedAt" timestamp with time zone,
	"createdAt" timestamp with time zone DEFAULT now() NOT NULL,
	"updatedAt" timestamp with time zone DEFAULT now() NOT NULL,
	CONSTRAINT "mcpClientAccess_tokenHash_unique" UNIQUE("tokenHash")
);
--> statement-breakpoint
ALTER TABLE "demo_grant_credential" ADD COLUMN "clientAccessId" text;--> statement-breakpoint
CREATE INDEX "demo_mcp_activity_agent" ON "mcpActivity" USING btree ("userId","agentId","createdAt");--> statement-breakpoint
CREATE INDEX "demo_mcp_client_agent" ON "mcpClientAccess" USING btree ("userId","agentId");--> statement-breakpoint
CREATE UNIQUE INDEX "demo_mcp_oauth_client_live" ON "mcpClientAccess" USING btree ("userId","agentId","oauthClientId") WHERE "mcpClientAccess"."status" <> 'revoked';--> statement-breakpoint
UPDATE "mcpConnection" SET "enabled" = false;
--> statement-breakpoint
UPDATE "mcpConnectionKey" SET "revokedAt" = now(), "revocationReason" = 'agent_owned_mcp_migration' WHERE "revokedAt" IS NULL;
--> statement-breakpoint
UPDATE "oauthResource" SET "disabled" = true WHERE "identifier" ~ '/api/mcp(/|$)';
--> statement-breakpoint
UPDATE "oauthRefreshToken" SET "revoked" = now() WHERE "revoked" IS NULL AND EXISTS (SELECT 1 FROM unnest("resources") resource WHERE resource ~ '/api/mcp(/|$)');
--> statement-breakpoint
INSERT INTO "mcpActivity" ("id", "clientName", "agentId", "userId", "authKind", "subject", "tool", "status", "operationId", "detail", "createdAt")
SELECT activity."id", COALESCE(connection."name", 'Legacy client'), activity."agentId", activity."userId", activity."authKind", activity."subject", activity."tool", activity."status", activity."operationId", activity."detail", activity."createdAt"
FROM "mcpConnectionActivity" activity LEFT JOIN "mcpConnection" connection ON connection."id" = activity."connectionId";
--> statement-breakpoint
ALTER TABLE "mcpClientAccess" ADD COLUMN "revokeSubmitted" boolean DEFAULT false NOT NULL;
--> statement-breakpoint
ALTER TABLE "mcpClientAccess" ADD COLUMN "grantRecipients" jsonb DEFAULT '[]'::jsonb NOT NULL;
