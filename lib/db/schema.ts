import type { GenerateIntentResponse } from "@near-intents-agent-api/sdk";
import { relations, sql } from "drizzle-orm";
import {
  bigint,
  boolean,
  index,
  jsonb,
  pgTable,
  text,
  timestamp,
  unique,
  uniqueIndex,
} from "drizzle-orm/pg-core";

export const user = pgTable("user", {
  id: text("id").primaryKey(),
  name: text("name").notNull(),
  email: text("email").notNull().unique(),
  emailVerified: boolean("emailVerified").notNull().default(false),
  image: text("image"),
  createdAt: timestamp("createdAt", { withTimezone: true }).notNull().defaultNow(),
  updatedAt: timestamp("updatedAt", { withTimezone: true }).notNull().defaultNow(),
});

export const session = pgTable(
  "session",
  {
    id: text("id").primaryKey(),
    expiresAt: timestamp("expiresAt", { withTimezone: true }).notNull(),
    token: text("token").notNull().unique(),
    createdAt: timestamp("createdAt", { withTimezone: true }).notNull().defaultNow(),
    updatedAt: timestamp("updatedAt", { withTimezone: true }).notNull().defaultNow(),
    ipAddress: text("ipAddress"),
    userAgent: text("userAgent"),
    userId: text("userId")
      .notNull()
      .references(() => user.id),
  },
  (table) => [index("demo_session_user").on(table.userId)],
);

export const account = pgTable(
  "account",
  {
    id: text("id").primaryKey(),
    accountId: text("accountId").notNull(),
    providerId: text("providerId").notNull(),
    userId: text("userId")
      .notNull()
      .references(() => user.id),
    accessToken: text("accessToken"),
    refreshToken: text("refreshToken"),
    idToken: text("idToken"),
    accessTokenExpiresAt: timestamp("accessTokenExpiresAt", { withTimezone: true }),
    refreshTokenExpiresAt: timestamp("refreshTokenExpiresAt", { withTimezone: true }),
    scope: text("scope"),
    password: text("password"),
    createdAt: timestamp("createdAt", { withTimezone: true }).notNull().defaultNow(),
    updatedAt: timestamp("updatedAt", { withTimezone: true }).notNull().defaultNow(),
  },
  (table) => [index("demo_account_user").on(table.userId)],
);

export const verification = pgTable("verification", {
  id: text("id").primaryKey(),
  identifier: text("identifier").notNull(),
  value: text("value").notNull(),
  expiresAt: timestamp("expiresAt", { withTimezone: true }).notNull(),
  createdAt: timestamp("createdAt", { withTimezone: true }).notNull().defaultNow(),
  updatedAt: timestamp("updatedAt", { withTimezone: true }).notNull().defaultNow(),
});

export const rateLimit = pgTable("rateLimit", {
  id: text("id").primaryKey(),
  key: text("key").notNull().unique(),
  count: bigint("count", { mode: "number" }).notNull(),
  lastRequest: bigint("lastRequest", { mode: "number" }).notNull(),
});

/** NEAR SIWN identity from `better-near-auth`. */
export const nearAccount = pgTable(
  "nearAccount",
  {
    id: text("id").primaryKey(),
    userId: text("userId")
      .notNull()
      .references(() => user.id),
    accountId: text("accountId").notNull(),
    network: text("network").notNull(),
    publicKey: text("publicKey").notNull(),
    isPrimary: boolean("isPrimary").notNull().default(false),
    createdAt: timestamp("createdAt", { withTimezone: true }).notNull().defaultNow(),
  },
  (table) => [
    unique("demo_near_account").on(table.accountId, table.network),
    index("demo_near_account_user").on(table.userId),
  ],
);

/** EVM SIWE wallet address from the Better Auth SIWE plugin. */
export const walletAddress = pgTable(
  "walletAddress",
  {
    id: text("id").primaryKey(),
    userId: text("userId")
      .notNull()
      .references(() => user.id),
    address: text("address").notNull(),
    chainId: bigint("chainId", { mode: "number" }).notNull(),
    publicKey: text("publicKey"),
    isPrimary: boolean("isPrimary").notNull().default(false),
    createdAt: timestamp("createdAt", { withTimezone: true }).notNull().defaultNow(),
  },
  (table) => [
    unique("demo_wallet_address").on(table.address, table.chainId),
    index("demo_wallet_address_user").on(table.userId),
  ],
);

/** WebAuthn credential metadata from `@better-auth/passkey`. */
export const passkey = pgTable(
  "passkey",
  {
    id: text("id").primaryKey(),
    name: text("name"),
    publicKey: text("publicKey").notNull(),
    userId: text("userId")
      .notNull()
      .references(() => user.id),
    credentialID: text("credentialID").notNull(),
    counter: bigint("counter", { mode: "number" }).notNull(),
    deviceType: text("deviceType").notNull(),
    backedUp: boolean("backedUp").notNull(),
    transports: text("transports"),
    createdAt: timestamp("createdAt", { withTimezone: true }).notNull().defaultNow(),
    aaguid: text("aaguid"),
  },
  (table) => [
    unique("demo_passkey_credential").on(table.credentialID),
    index("demo_passkey_user").on(table.userId),
  ],
);

/**
 * Declared by `better-near-auth` even when no relayer is configured. The demo does not use
 * gasless relay (no fund-moving execution in v1), but Better Auth requires the model to exist.
 */
export const relayedTransaction = pgTable(
  "relayedTransaction",
  {
    id: text("id").primaryKey(),
    userId: text("userId").references(() => user.id),
    txHash: text("txHash").notNull(),
    senderId: text("senderId").notNull(),
    receiverId: text("receiverId").notNull(),
    network: text("network").notNull(),
    status: text("status").notNull(),
    gasUsed: text("gasUsed"),
    createdAt: timestamp("createdAt", { withTimezone: true }).notNull().defaultNow(),
    updatedAt: timestamp("updatedAt", { withTimezone: true }),
  },
  (table) => [index("demo_relayed_transaction_user").on(table.userId)],
);

export const relayerKey = pgTable("relayerKey", {
  id: text("id").primaryKey(),
  accountId: text("accountId").notNull(),
  encryptedPrivateKey: text("encryptedPrivateKey").notNull(),
  iv: text("iv").notNull(),
  publicKey: text("publicKey").notNull(),
  network: text("network").notNull(),
  createdAt: timestamp("createdAt", { withTimezone: true }).notNull().defaultNow(),
  lastUsedAt: timestamp("lastUsedAt", { withTimezone: true }),
});

/**
 * Signing key for the JWT plugin. The MCP plugin requires it: it signs ID/access
 * tokens and serves the `/jwks` endpoint resource servers verify against.
 */
export const jwks = pgTable("jwks", {
  id: text("id").primaryKey(),
  publicKey: text("publicKey").notNull(),
  privateKey: text("privateKey").notNull(),
  createdAt: timestamp("createdAt", { withTimezone: true }).notNull().defaultNow(),
  expiresAt: timestamp("expiresAt", { withTimezone: true }),
  alg: text("alg"),
  crv: text("crv"),
});

/**
 * OAuth client registered by an MCP harness, either through Client ID Metadata
 * Documents (`clientDiscoveryId: "cimd"`) or Dynamic Client Registration. The
 * demo's consent page is what authorizes a client for one agent resource.
 */
export const oauthClient = pgTable("oauthClient", {
  id: text("id").primaryKey(),
  clientId: text("clientId").notNull().unique(),
  clientSecret: text("clientSecret"),
  clientDiscoveryId: text("clientDiscoveryId"),
  disabled: boolean("disabled").default(false),
  skipConsent: boolean("skipConsent"),
  enableEndSession: boolean("enableEndSession"),
  subjectType: text("subjectType"),
  scopes: text("scopes").array(),
  clientCredentialsScopes: text("clientCredentialsScopes").array().default([]),
  userId: text("userId"),
  createdAt: timestamp("createdAt", { withTimezone: true }).defaultNow(),
  updatedAt: timestamp("updatedAt", { withTimezone: true }).defaultNow(),
  name: text("name"),
  uri: text("uri"),
  icon: text("icon"),
  contacts: text("contacts").array(),
  tos: text("tos"),
  policy: text("policy"),
  softwareId: text("softwareId"),
  softwareVersion: text("softwareVersion"),
  softwareStatement: text("softwareStatement"),
  redirectUris: text("redirectUris").array().notNull(),
  postLogoutRedirectUris: text("postLogoutRedirectUris").array(),
  backchannelLogoutUri: text("backchannelLogoutUri"),
  backchannelLogoutSessionRequired: boolean("backchannelLogoutSessionRequired"),
  tokenEndpointAuthMethod: text("tokenEndpointAuthMethod"),
  applicationType: text("applicationType"),
  jwks: text("jwks"),
  jwksUri: text("jwksUri"),
  grantTypes: text("grantTypes").array(),
  responseTypes: text("responseTypes").array(),
  requirePKCE: boolean("requirePKCE"),
  dpopBoundAccessTokens: boolean("dpopBoundAccessTokens").default(false),
  referenceId: text("referenceId"),
  metadata: jsonb("metadata"),
});

/** One protected resource per agent. The MCP token audience is this identifier. */
export const oauthResource = pgTable("oauthResource", {
  id: text("id").primaryKey(),
  identifier: text("identifier").notNull().unique(),
  name: text("name").notNull(),
  accessTokenTtl: bigint("accessTokenTtl", { mode: "number" }),
  refreshTokenTtl: bigint("refreshTokenTtl", { mode: "number" }),
  signingAlgorithm: text("signingAlgorithm"),
  signingKeyId: text("signingKeyId"),
  allowedScopes: text("allowedScopes").array(),
  customClaims: jsonb("customClaims"),
  dpopBoundAccessTokensRequired: boolean("dpopBoundAccessTokensRequired").default(false),
  disabled: boolean("disabled").default(false),
  createdAt: timestamp("createdAt", { withTimezone: true }).defaultNow(),
  updatedAt: timestamp("updatedAt", { withTimezone: true }).defaultNow(),
  policyVersion: bigint("policyVersion", { mode: "number" }).default(0),
  metadata: jsonb("metadata"),
});

/** Client↔resource link. Retained for audit even though enforcement is off. */
export const oauthClientResource = pgTable(
  "oauthClientResource",
  {
    id: text("id").primaryKey(),
    clientId: text("clientId").notNull(),
    resourceId: text("resourceId").notNull(),
    metadata: jsonb("metadata"),
    createdAt: timestamp("createdAt", { withTimezone: true }).defaultNow(),
  },
  (table) => [unique("demo_oauth_client_resource").on(table.clientId, table.resourceId)],
);

/** Owner consent for one client and, once granted, the resources it may request. */
export const oauthConsent = pgTable(
  "oauthConsent",
  {
    id: text("id").primaryKey(),
    clientId: text("clientId").notNull(),
    userId: text("userId"),
    referenceId: text("referenceId"),
    resources: text("resources").array(),
    requestedUserInfoClaims: text("requestedUserInfoClaims").array(),
    scopes: text("scopes").array().notNull(),
    createdAt: timestamp("createdAt", { withTimezone: true }).defaultNow(),
    updatedAt: timestamp("updatedAt", { withTimezone: true }).defaultNow(),
  },
  (table) => [index("demo_oauth_consent_client").on(table.clientId, table.userId)],
);

export const oauthRefreshToken = pgTable(
  "oauthRefreshToken",
  {
    id: text("id").primaryKey(),
    token: text("token").notNull().unique(),
    clientId: text("clientId").notNull(),
    sessionId: text("sessionId"),
    userId: text("userId").notNull(),
    referenceId: text("referenceId"),
    authorizationCodeId: text("authorizationCodeId"),
    resources: text("resources").array(),
    requestedUserInfoClaims: text("requestedUserInfoClaims").array(),
    expiresAt: timestamp("expiresAt", { withTimezone: true }),
    createdAt: timestamp("createdAt", { withTimezone: true }),
    revoked: timestamp("revoked", { withTimezone: true }),
    rotatedAt: timestamp("rotatedAt", { withTimezone: true }),
    rotationReplayResponse: text("rotationReplayResponse"),
    rotationReplayExpiresAt: timestamp("rotationReplayExpiresAt", { withTimezone: true }),
    authTime: timestamp("authTime", { withTimezone: true }),
    confirmation: jsonb("confirmation"),
    scopes: text("scopes").array().notNull(),
  },
  (table) => [index("demo_oauth_refresh_client").on(table.clientId)],
);

export const oauthAccessToken = pgTable(
  "oauthAccessToken",
  {
    id: text("id").primaryKey(),
    token: text("token").unique(),
    clientId: text("clientId").notNull(),
    sessionId: text("sessionId"),
    userId: text("userId"),
    referenceId: text("referenceId"),
    authorizationCodeId: text("authorizationCodeId"),
    resources: text("resources").array(),
    requestedUserInfoClaims: text("requestedUserInfoClaims").array(),
    refreshId: text("refreshId"),
    expiresAt: timestamp("expiresAt", { withTimezone: true }),
    createdAt: timestamp("createdAt", { withTimezone: true }),
    revoked: timestamp("revoked", { withTimezone: true }),
    confirmation: jsonb("confirmation"),
    scopes: text("scopes").array().notNull(),
  },
  (table) => [index("demo_oauth_access_client").on(table.clientId)],
);

/** Single-use `private_key_jwt` assertion tombstones. */
export const oauthClientAssertion = pgTable("oauthClientAssertion", {
  id: text("id").primaryKey(),
  expiresAt: timestamp("expiresAt", { withTimezone: true }).notNull(),
});

/** Read-only legacy records retained for migration and historical attribution. */
export const legacyMcpConnection = pgTable(
  "mcpConnection",
  {
    id: text("id").primaryKey(),
    userId: text("userId").notNull(),
    name: text("name").notNull(),
    agentId: text("agentId").notNull(),
    enabled: boolean("enabled").notNull().default(true),
    createdAt: timestamp("createdAt", { withTimezone: true }).notNull().defaultNow(),
    updatedAt: timestamp("updatedAt", { withTimezone: true }).notNull().defaultNow(),
  },
  (table) => [
    index("demo_mcp_connection_user").on(table.userId),
    index("demo_mcp_connection_agent").on(table.agentId),
  ],
);

/** Legacy credentials are invalidated by the agent-owned MCP migration. */
export const legacyMcpConnectionKey = pgTable(
  "mcpConnectionKey",
  {
    id: text("id").primaryKey(),
    connectionId: text("connectionId").notNull(),
    /** Immutable agent this key was issued against. */
    agentId: text("agentId").notNull(),
    name: text("name").notNull(),
    tokenHash: text("tokenHash").notNull().unique(),
    prefix: text("prefix").notNull(),
    createdAt: timestamp("createdAt", { withTimezone: true }).notNull().defaultNow(),
    /** Bounded credential lifetime; an unlimited harness key outlives every session that made it. */
    expiresAt: timestamp("expiresAt", { withTimezone: true }).notNull(),
    lastUsedAt: timestamp("lastUsedAt", { withTimezone: true }),
    revokedAt: timestamp("revokedAt", { withTimezone: true }),
    revocationReason: text("revocationReason"),
  },
  (table) => [index("demo_mcp_connection_key_connection").on(table.connectionId)],
);

/**
 * MCP tool activity. The demo keeps this because provider request history is the custody
 * wallet's feed, not a record of which harness called which tool on which agent.
 */
export const legacyMcpConnectionActivity = pgTable(
  "mcpConnectionActivity",
  {
    id: text("id").primaryKey(),
    connectionId: text("connectionId").notNull(),
    agentId: text("agentId").notNull(),
    userId: text("userId").notNull(),
    authKind: text("authKind").$type<"oauth" | "api_key">().notNull(),
    subject: text("subject").notNull(),
    tool: text("tool").notNull(),
    status: text("status").notNull(),
    operationId: text("operationId"),
    detail: text("detail"),
    createdAt: timestamp("createdAt", { withTimezone: true }).notNull().defaultNow(),
  },
  (table) => [index("demo_mcp_activity_connection").on(table.connectionId, table.createdAt)],
);

/** One immutable client authorization generation inside an agent account. */
export const mcpClientAccess = pgTable(
  "mcpClientAccess",
  {
    id: text("id").primaryKey(),
    userId: text("userId").notNull(),
    agentId: text("agentId").notNull(),
    name: text("name").notNull(),
    authKind: text("authKind").$type<"oauth" | "api_key">().notNull(),
    oauthClientId: text("oauthClientId"),
    status: text("status")
      .$type<"pending" | "consenting" | "authorized" | "revoked">()
      .notNull()
      .default("pending"),
    tokenHash: text("tokenHash").unique(),
    prefix: text("prefix"),
    expiresAt: timestamp("expiresAt", { withTimezone: true }),
    lastUsedAt: timestamp("lastUsedAt", { withTimezone: true }),
    grantId: text("grantId"),
    grantCorrelationId: text("grantCorrelationId"),
    grantSubmitted: boolean("grantSubmitted").notNull().default(false),
    oauthQueryHash: text("oauthQueryHash"),
    revokeCorrelationId: text("revokeCorrelationId"),
    revokeSubmitted: boolean("revokeSubmitted").notNull().default(false),
    revokedAt: timestamp("revokedAt", { withTimezone: true }),
    createdAt: timestamp("createdAt", { withTimezone: true }).notNull().defaultNow(),
    updatedAt: timestamp("updatedAt", { withTimezone: true }).notNull().defaultNow(),
  },
  (table) => [
    index("demo_mcp_client_agent").on(table.userId, table.agentId),
    uniqueIndex("demo_mcp_oauth_client_live")
      .on(table.userId, table.agentId, table.oauthClientId)
      .where(sql`${table.status} <> 'revoked'`),
  ],
);

/** Names are snapshots: revoking access never erases tool attribution. */
export const mcpActivity = pgTable(
  "mcpActivity",
  {
    id: text("id").primaryKey(),
    clientAccessId: text("clientAccessId"),
    clientName: text("clientName").notNull(),
    agentId: text("agentId").notNull(),
    userId: text("userId").notNull(),
    authKind: text("authKind").$type<"oauth" | "api_key">().notNull(),
    subject: text("subject").notNull(),
    tool: text("tool").notNull(),
    status: text("status").notNull(),
    operationId: text("operationId"),
    detail: text("detail"),
    createdAt: timestamp("createdAt", { withTimezone: true }).notNull().defaultNow(),
  },
  (table) => [index("demo_mcp_activity_agent").on(table.userId, table.agentId, table.createdAt)],
);

/**
 * Grant tokens the demo holds, one per owner grant: the dashboard's own grant per user and agent,
 * and one per MCP client. The demo's single Agent API key only identifies the demo; each
 * token is a separate owner-signed permission, so revoking one never touches another. Tokens are
 * sealed with `SECRET_ENCRYPTION_KEY`; the commitment is what the owner signed.
 */
export const grantCredential = pgTable(
  "demo_grant_credential",
  {
    id: text("id").primaryKey(),
    userId: text("userId")
      .notNull()
      .references(() => user.id, { onDelete: "cascade" }),
    agentId: text("agentId").notNull(),
    holder: text("holder").$type<"dashboard" | "mcp">().notNull(),
    /** Legacy association, retained only for historical records. */
    connectionId: text("connectionId"),
    clientAccessId: text("clientAccessId"),
    label: text("label").notNull(),
    commitment: text("commitment").notNull().unique(),
    sealedToken: text("sealedToken").notNull(),
    createdAt: timestamp("createdAt", { withTimezone: true }).notNull().defaultNow(),
  },
  (table) => [
    index("demo_grant_credential_holder").on(table.userId, table.agentId, table.holder),
    index("demo_grant_credential_connection").on(table.connectionId),
  ],
);

export type ChallengePurpose = "siwe" | "binding" | "policy" | "approval" | "grant";

/** Single-use, short-lived login and consent challenges. Login never reuses consent. */
export const challenge = pgTable(
  "challenge",
  {
    id: text("id").primaryKey(),
    purpose: text("purpose").$type<ChallengePurpose>().notNull(),
    subject: text("subject").notNull(),
    payload: jsonb("payload").notNull(),
    expiresAt: timestamp("expiresAt", { withTimezone: true }).notNull(),
    createdAt: timestamp("createdAt", { withTimezone: true }).notNull().defaultNow(),
  },
  (table) => [index("demo_challenge_subject").on(table.purpose, table.subject)],
);

/** Correlation ownership survives refresh without storing SDK workflow checkpoints. */
export const ownerIntent = pgTable(
  "demo_owner_intent",
  {
    correlationId: text("correlationId").primaryKey(),
    userId: text("userId")
      .notNull()
      .references(() => user.id, { onDelete: "cascade" }),
    agentId: text("agentId").notNull(),
    /** Intent type, copied from `generated.type` so the latest intent of a kind is indexable. */
    type: text("type").$type<GenerateIntentResponse["type"]>().notNull(),
    generated: jsonb("generated").$type<GenerateIntentResponse>().notNull(),
    createdAt: timestamp("createdAt", { withTimezone: true }).notNull().defaultNow(),
  },
  (table) => [
    index("demo_owner_intent_latest").on(table.userId, table.agentId, table.type, table.createdAt),
  ],
);

export const userRelations = relations(user, ({ many }) => ({
  sessions: many(session),
  accounts: many(account),
  nearAccounts: many(nearAccount),
  walletAddresses: many(walletAddress),
  passkeys: many(passkey),
}));

export const schema = {
  ownerIntent,
  grantCredential,
  user,
  session,
  account,
  verification,
  rateLimit,
  nearAccount,
  walletAddress,
  passkey,
  challenge,
  relayedTransaction,
  relayerKey,
  jwks,
  oauthClient,
  oauthResource,
  oauthClientResource,
  oauthConsent,
  oauthRefreshToken,
  oauthAccessToken,
  oauthClientAssertion,
  legacyMcpConnection,
  legacyMcpConnectionKey,
  legacyMcpConnectionActivity,
  mcpClientAccess,
  mcpActivity,
  userRelations,
};
