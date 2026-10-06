CREATE TABLE "account" (
	"id" text PRIMARY KEY NOT NULL,
	"accountId" text NOT NULL,
	"providerId" text NOT NULL,
	"userId" text NOT NULL,
	"accessToken" text,
	"refreshToken" text,
	"idToken" text,
	"accessTokenExpiresAt" timestamp with time zone,
	"refreshTokenExpiresAt" timestamp with time zone,
	"scope" text,
	"password" text,
	"createdAt" timestamp with time zone DEFAULT now() NOT NULL,
	"updatedAt" timestamp with time zone DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "challenge" (
	"id" text PRIMARY KEY NOT NULL,
	"purpose" text NOT NULL,
	"subject" text NOT NULL,
	"payload" jsonb NOT NULL,
	"expiresAt" timestamp with time zone NOT NULL,
	"createdAt" timestamp with time zone DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "demo_grant_credential" (
	"id" text PRIMARY KEY NOT NULL,
	"userId" text NOT NULL,
	"agentId" text NOT NULL,
	"holder" text NOT NULL,
	"connectionId" text,
	"clientAccessId" text,
	"label" text NOT NULL,
	"commitment" text NOT NULL,
	"sealedToken" text NOT NULL,
	"createdAt" timestamp with time zone DEFAULT now() NOT NULL,
	CONSTRAINT "demo_grant_credential_commitment_unique" UNIQUE("commitment")
);
--> statement-breakpoint
CREATE TABLE "jwks" (
	"id" text PRIMARY KEY NOT NULL,
	"publicKey" text NOT NULL,
	"privateKey" text NOT NULL,
	"createdAt" timestamp with time zone DEFAULT now() NOT NULL,
	"expiresAt" timestamp with time zone,
	"alg" text,
	"crv" text
);
--> statement-breakpoint
CREATE TABLE "mcpConnection" (
	"id" text PRIMARY KEY NOT NULL,
	"userId" text NOT NULL,
	"name" text NOT NULL,
	"agentId" text NOT NULL,
	"enabled" boolean DEFAULT true NOT NULL,
	"createdAt" timestamp with time zone DEFAULT now() NOT NULL,
	"updatedAt" timestamp with time zone DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "mcpConnectionActivity" (
	"id" text PRIMARY KEY NOT NULL,
	"connectionId" text NOT NULL,
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
CREATE TABLE "mcpConnectionKey" (
	"id" text PRIMARY KEY NOT NULL,
	"connectionId" text NOT NULL,
	"agentId" text NOT NULL,
	"name" text NOT NULL,
	"tokenHash" text NOT NULL,
	"prefix" text NOT NULL,
	"createdAt" timestamp with time zone DEFAULT now() NOT NULL,
	"expiresAt" timestamp with time zone NOT NULL,
	"lastUsedAt" timestamp with time zone,
	"revokedAt" timestamp with time zone,
	"revocationReason" text,
	CONSTRAINT "mcpConnectionKey_tokenHash_unique" UNIQUE("tokenHash")
);
--> statement-breakpoint
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
	"revokeSubmitted" boolean DEFAULT false NOT NULL,
	"revokedAt" timestamp with time zone,
	"createdAt" timestamp with time zone DEFAULT now() NOT NULL,
	"updatedAt" timestamp with time zone DEFAULT now() NOT NULL,
	CONSTRAINT "mcpClientAccess_tokenHash_unique" UNIQUE("tokenHash")
);
--> statement-breakpoint
CREATE TABLE "nearAccount" (
	"id" text PRIMARY KEY NOT NULL,
	"userId" text NOT NULL,
	"accountId" text NOT NULL,
	"network" text NOT NULL,
	"publicKey" text NOT NULL,
	"isPrimary" boolean DEFAULT false NOT NULL,
	"createdAt" timestamp with time zone DEFAULT now() NOT NULL,
	CONSTRAINT "demo_near_account" UNIQUE("accountId","network")
);
--> statement-breakpoint
CREATE TABLE "oauthAccessToken" (
	"id" text PRIMARY KEY NOT NULL,
	"token" text,
	"clientId" text NOT NULL,
	"sessionId" text,
	"userId" text,
	"referenceId" text,
	"authorizationCodeId" text,
	"resources" text[],
	"requestedUserInfoClaims" text[],
	"refreshId" text,
	"expiresAt" timestamp with time zone,
	"createdAt" timestamp with time zone,
	"revoked" timestamp with time zone,
	"confirmation" jsonb,
	"scopes" text[] NOT NULL,
	CONSTRAINT "oauthAccessToken_token_unique" UNIQUE("token")
);
--> statement-breakpoint
CREATE TABLE "oauthClient" (
	"id" text PRIMARY KEY NOT NULL,
	"clientId" text NOT NULL,
	"clientSecret" text,
	"clientDiscoveryId" text,
	"disabled" boolean DEFAULT false,
	"skipConsent" boolean,
	"enableEndSession" boolean,
	"subjectType" text,
	"scopes" text[],
	"clientCredentialsScopes" text[] DEFAULT '{}',
	"userId" text,
	"createdAt" timestamp with time zone DEFAULT now(),
	"updatedAt" timestamp with time zone DEFAULT now(),
	"name" text,
	"uri" text,
	"icon" text,
	"contacts" text[],
	"tos" text,
	"policy" text,
	"softwareId" text,
	"softwareVersion" text,
	"softwareStatement" text,
	"redirectUris" text[] NOT NULL,
	"postLogoutRedirectUris" text[],
	"backchannelLogoutUri" text,
	"backchannelLogoutSessionRequired" boolean,
	"tokenEndpointAuthMethod" text,
	"applicationType" text,
	"jwks" text,
	"jwksUri" text,
	"grantTypes" text[],
	"responseTypes" text[],
	"requirePKCE" boolean,
	"dpopBoundAccessTokens" boolean DEFAULT false,
	"referenceId" text,
	"metadata" jsonb,
	CONSTRAINT "oauthClient_clientId_unique" UNIQUE("clientId")
);
--> statement-breakpoint
CREATE TABLE "oauthClientAssertion" (
	"id" text PRIMARY KEY NOT NULL,
	"expiresAt" timestamp with time zone NOT NULL
);
--> statement-breakpoint
CREATE TABLE "oauthClientResource" (
	"id" text PRIMARY KEY NOT NULL,
	"clientId" text NOT NULL,
	"resourceId" text NOT NULL,
	"metadata" jsonb,
	"createdAt" timestamp with time zone DEFAULT now(),
	CONSTRAINT "demo_oauth_client_resource" UNIQUE("clientId","resourceId")
);
--> statement-breakpoint
CREATE TABLE "oauthConsent" (
	"id" text PRIMARY KEY NOT NULL,
	"clientId" text NOT NULL,
	"userId" text,
	"referenceId" text,
	"resources" text[],
	"requestedUserInfoClaims" text[],
	"scopes" text[] NOT NULL,
	"createdAt" timestamp with time zone DEFAULT now(),
	"updatedAt" timestamp with time zone DEFAULT now()
);
--> statement-breakpoint
CREATE TABLE "oauthRefreshToken" (
	"id" text PRIMARY KEY NOT NULL,
	"token" text NOT NULL,
	"clientId" text NOT NULL,
	"sessionId" text,
	"userId" text NOT NULL,
	"referenceId" text,
	"authorizationCodeId" text,
	"resources" text[],
	"requestedUserInfoClaims" text[],
	"expiresAt" timestamp with time zone,
	"createdAt" timestamp with time zone,
	"revoked" timestamp with time zone,
	"rotatedAt" timestamp with time zone,
	"rotationReplayResponse" text,
	"rotationReplayExpiresAt" timestamp with time zone,
	"authTime" timestamp with time zone,
	"confirmation" jsonb,
	"scopes" text[] NOT NULL,
	CONSTRAINT "oauthRefreshToken_token_unique" UNIQUE("token")
);
--> statement-breakpoint
CREATE TABLE "oauthResource" (
	"id" text PRIMARY KEY NOT NULL,
	"identifier" text NOT NULL,
	"name" text NOT NULL,
	"accessTokenTtl" bigint,
	"refreshTokenTtl" bigint,
	"signingAlgorithm" text,
	"signingKeyId" text,
	"allowedScopes" text[],
	"customClaims" jsonb,
	"dpopBoundAccessTokensRequired" boolean DEFAULT false,
	"disabled" boolean DEFAULT false,
	"createdAt" timestamp with time zone DEFAULT now(),
	"updatedAt" timestamp with time zone DEFAULT now(),
	"policyVersion" bigint DEFAULT 0,
	"metadata" jsonb,
	CONSTRAINT "oauthResource_identifier_unique" UNIQUE("identifier")
);
--> statement-breakpoint
CREATE TABLE "demo_owner_intent" (
	"correlationId" text PRIMARY KEY NOT NULL,
	"userId" text NOT NULL,
	"agentId" text NOT NULL,
	"type" text NOT NULL,
	"generated" jsonb NOT NULL,
	"createdAt" timestamp with time zone DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "passkey" (
	"id" text PRIMARY KEY NOT NULL,
	"name" text,
	"publicKey" text NOT NULL,
	"userId" text NOT NULL,
	"credentialID" text NOT NULL,
	"counter" bigint NOT NULL,
	"deviceType" text NOT NULL,
	"backedUp" boolean NOT NULL,
	"transports" text,
	"createdAt" timestamp with time zone DEFAULT now() NOT NULL,
	"aaguid" text,
	CONSTRAINT "demo_passkey_credential" UNIQUE("credentialID")
);
--> statement-breakpoint
CREATE TABLE "rateLimit" (
	"id" text PRIMARY KEY NOT NULL,
	"key" text NOT NULL,
	"count" bigint NOT NULL,
	"lastRequest" bigint NOT NULL,
	CONSTRAINT "rateLimit_key_unique" UNIQUE("key")
);
--> statement-breakpoint
CREATE TABLE "relayedTransaction" (
	"id" text PRIMARY KEY NOT NULL,
	"userId" text,
	"txHash" text NOT NULL,
	"senderId" text NOT NULL,
	"receiverId" text NOT NULL,
	"network" text NOT NULL,
	"status" text NOT NULL,
	"gasUsed" text,
	"createdAt" timestamp with time zone DEFAULT now() NOT NULL,
	"updatedAt" timestamp with time zone
);
--> statement-breakpoint
CREATE TABLE "relayerKey" (
	"id" text PRIMARY KEY NOT NULL,
	"accountId" text NOT NULL,
	"encryptedPrivateKey" text NOT NULL,
	"iv" text NOT NULL,
	"publicKey" text NOT NULL,
	"network" text NOT NULL,
	"createdAt" timestamp with time zone DEFAULT now() NOT NULL,
	"lastUsedAt" timestamp with time zone
);
--> statement-breakpoint
CREATE TABLE "session" (
	"id" text PRIMARY KEY NOT NULL,
	"expiresAt" timestamp with time zone NOT NULL,
	"token" text NOT NULL,
	"createdAt" timestamp with time zone DEFAULT now() NOT NULL,
	"updatedAt" timestamp with time zone DEFAULT now() NOT NULL,
	"ipAddress" text,
	"userAgent" text,
	"userId" text NOT NULL,
	CONSTRAINT "session_token_unique" UNIQUE("token")
);
--> statement-breakpoint
CREATE TABLE "user" (
	"id" text PRIMARY KEY NOT NULL,
	"name" text NOT NULL,
	"email" text NOT NULL,
	"emailVerified" boolean DEFAULT false NOT NULL,
	"image" text,
	"createdAt" timestamp with time zone DEFAULT now() NOT NULL,
	"updatedAt" timestamp with time zone DEFAULT now() NOT NULL,
	CONSTRAINT "user_email_unique" UNIQUE("email")
);
--> statement-breakpoint
CREATE TABLE "verification" (
	"id" text PRIMARY KEY NOT NULL,
	"identifier" text NOT NULL,
	"value" text NOT NULL,
	"expiresAt" timestamp with time zone NOT NULL,
	"createdAt" timestamp with time zone DEFAULT now() NOT NULL,
	"updatedAt" timestamp with time zone DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "walletAddress" (
	"id" text PRIMARY KEY NOT NULL,
	"userId" text NOT NULL,
	"address" text NOT NULL,
	"chainId" bigint NOT NULL,
	"publicKey" text,
	"isPrimary" boolean DEFAULT false NOT NULL,
	"createdAt" timestamp with time zone DEFAULT now() NOT NULL,
	CONSTRAINT "demo_wallet_address" UNIQUE("address","chainId")
);
--> statement-breakpoint
ALTER TABLE "account" ADD CONSTRAINT "account_userId_user_id_fk" FOREIGN KEY ("userId") REFERENCES "public"."user"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "demo_grant_credential" ADD CONSTRAINT "demo_grant_credential_userId_user_id_fk" FOREIGN KEY ("userId") REFERENCES "public"."user"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "nearAccount" ADD CONSTRAINT "nearAccount_userId_user_id_fk" FOREIGN KEY ("userId") REFERENCES "public"."user"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "demo_owner_intent" ADD CONSTRAINT "demo_owner_intent_userId_user_id_fk" FOREIGN KEY ("userId") REFERENCES "public"."user"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "passkey" ADD CONSTRAINT "passkey_userId_user_id_fk" FOREIGN KEY ("userId") REFERENCES "public"."user"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "relayedTransaction" ADD CONSTRAINT "relayedTransaction_userId_user_id_fk" FOREIGN KEY ("userId") REFERENCES "public"."user"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "session" ADD CONSTRAINT "session_userId_user_id_fk" FOREIGN KEY ("userId") REFERENCES "public"."user"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "walletAddress" ADD CONSTRAINT "walletAddress_userId_user_id_fk" FOREIGN KEY ("userId") REFERENCES "public"."user"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
CREATE INDEX "demo_account_user" ON "account" USING btree ("userId");--> statement-breakpoint
CREATE INDEX "demo_challenge_subject" ON "challenge" USING btree ("purpose","subject");--> statement-breakpoint
CREATE INDEX "demo_grant_credential_holder" ON "demo_grant_credential" USING btree ("userId","agentId","holder");--> statement-breakpoint
CREATE INDEX "demo_grant_credential_connection" ON "demo_grant_credential" USING btree ("connectionId");--> statement-breakpoint
CREATE INDEX "demo_mcp_connection_user" ON "mcpConnection" USING btree ("userId");--> statement-breakpoint
CREATE INDEX "demo_mcp_connection_agent" ON "mcpConnection" USING btree ("agentId");--> statement-breakpoint
CREATE INDEX "demo_mcp_activity_connection" ON "mcpConnectionActivity" USING btree ("connectionId","createdAt");--> statement-breakpoint
CREATE INDEX "demo_mcp_connection_key_connection" ON "mcpConnectionKey" USING btree ("connectionId");--> statement-breakpoint
CREATE INDEX "demo_mcp_activity_agent" ON "mcpActivity" USING btree ("userId","agentId","createdAt");--> statement-breakpoint
CREATE INDEX "demo_mcp_client_agent" ON "mcpClientAccess" USING btree ("userId","agentId");--> statement-breakpoint
CREATE UNIQUE INDEX "demo_mcp_oauth_client_live" ON "mcpClientAccess" USING btree ("userId","agentId","oauthClientId") WHERE "mcpClientAccess"."status" <> 'revoked';--> statement-breakpoint
CREATE INDEX "demo_near_account_user" ON "nearAccount" USING btree ("userId");--> statement-breakpoint
CREATE INDEX "demo_oauth_access_client" ON "oauthAccessToken" USING btree ("clientId");--> statement-breakpoint
CREATE INDEX "demo_oauth_consent_client" ON "oauthConsent" USING btree ("clientId","userId");--> statement-breakpoint
CREATE INDEX "demo_oauth_refresh_client" ON "oauthRefreshToken" USING btree ("clientId");--> statement-breakpoint
CREATE INDEX "demo_owner_intent_latest" ON "demo_owner_intent" USING btree ("userId","agentId","type","createdAt");--> statement-breakpoint
CREATE INDEX "demo_passkey_user" ON "passkey" USING btree ("userId");--> statement-breakpoint
CREATE INDEX "demo_relayed_transaction_user" ON "relayedTransaction" USING btree ("userId");--> statement-breakpoint
CREATE INDEX "demo_session_user" ON "session" USING btree ("userId");--> statement-breakpoint
CREATE INDEX "demo_wallet_address_user" ON "walletAddress" USING btree ("userId");