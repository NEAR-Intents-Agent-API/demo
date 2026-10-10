<div align="center">

<img src="app/icon.png" alt="NEAR Intents Agent API demo" width="96" height="96">

# NEAR Intents Agent API Demo

**An owner dashboard and MCP/OAuth server for AI agents on NEAR Intents, built on the public Agent API.**

[Live demo](https://demo.agentsonintents.com) · [Features](#features) · [Getting started](#getting-started) · [User flow](#user-flow) · [MCP](#mcp-authorization) · [Development](#development)

</div>

A Next.js app that shows what you can build on [`@near-intents-agent-api/sdk`](https://www.npmjs.com/package/@near-intents-agent-api/sdk).
It is an ordinary API client: the API knows nothing about it. Sign in, create an agent account
with plain-language rules, fund it, move money, and connect an MCP client such as Codex or
OpenClaw, all under rules the owner signed.

## Features

- **Three login methods**: EVM wallet (SIWE), NEAR wallet (SIWN) and passkeys. No email or social login.
- **One-signature agent creation** with a plain-language rules editor (what it can do, which
  tokens, the most one move may spend, where funds can go, owner approval).
- **Wallet tab**: holdings with USD values (public and private), swap, transfer, deposit,
  withdraw and shield/unshield, each against the public or private balance.
- **Activity and Rules tabs**: operations and pending owner approvals; live rules, emergency
  stop, USD budget and execution delay, all editable in place.
- **MCP/OAuth server**: one endpoint per account, one owner-signed grant per client, instant revocation.
- **Live token catalogue** from the Agent API's public `GET /v1/tokens`.

## Getting started

Requirements: Node.js 24+, pnpm and Docker.

```sh
pnpm install
cp .env.example .env     # then fill in the values below
pnpm docker:up           # local Postgres on port 5435
pnpm dev                 # applies migrations, then serves on http://localhost:3002
```

```dotenv
NEAR_INTENTS_AGENT_API_URL=http://localhost:3000
NEAR_INTENTS_AGENT_API_KEY=naa___
DATABASE_URL=postgresql://near_intents_agent_demo:YOUR_PASSWORD@localhost:5435/near_intents_agent_demo
SECRET_ENCRYPTION_KEY=YOUR_SECRET_ENCRYPTION_KEY
BETTER_AUTH_SECRET=YOUR_BETTER_AUTH_SECRET
```

| Variable | Value |
|---|---|
| `NEAR_INTENTS_AGENT_API_URL` | A running [Agent API](https://github.com/NEAR-Intents-Agent-API/api); hosted: `https://api.agentsonintents.com` |
| `NEAR_INTENTS_AGENT_API_KEY` | A real, server-only partner API key (`naa_…`) from the [partner dashboard](https://partners.near-intents.org/) |
| `DATABASE_URL` | `pnpm docker:up` creates `near_intents_agent_demo` as database, user and password; use that password |
| `SECRET_ENCRYPTION_KEY`, `BETTER_AUTH_SECRET` | Two separate 32–64 character secrets, each from `openssl rand -hex 32` |

The demo database holds login, passkeys, OAuth/MCP records and owner-intent correlation records,
separate from the API database.

> [!IMPORTANT]
> Serve production over HTTPS on **one stable hostname**, and make the proxy overwrite
> `Host`/`X-Forwarded-Host`. The auth URL, passkey relying party and MCP resource URLs derive from
> that host, so changing it changes passkey scope, sessions and OAuth resources. Keep
> `BETTER_AUTH_SECRET` stable too: it protects sessions and MCP authorizations. Changing the API
> key, API URL or app origin does not change it.

Production: `pnpm build`, `pnpm start`, and run `pnpm db:migrate` before each deploy.

## User flow

1. **Sign in** with an EVM wallet, NEAR wallet or passkey.
2. **Create an agent**: a name, rules, one signature. New agents can do everything NEAR Intents
   offers (swap, send, withdraw to any network, private balance). Rules map to the account policy
   in `features/policy/rules/rules.ts`. The dialog waits until the account is live; an
   interrupted activation resumes.
3. **Fund it.** Deposits need only the signed-in owner's session: a one-time 1Click address for a
   chosen network and token (optionally an amount), or a transfer from any NEAR Intents account.
   No grant signature is needed, and a failed or late deposit refunds into the agent's own balance.
4. **Authorize the dashboard** to spend. Swaps, sends, withdrawals and shield/unshield need one
   owner signature on a `grant_issue` for the dashboard's own grant token, valid for 1, 7 or 30
   days. The dialog shows the live account rules: exactly what the dashboard, and every other
   grant, may do.
5. **Approve destinations.** Withdrawals and sends only reach destinations the account allows. A
   new account starts with an empty "Only these" list; approving a destination is one off-chain
   signature that every grant uses at once.
6. **Connect clients** in the **Connect** tab (see below) and watch their calls in Activity.

A flow the rules forbid says so instead of failing at the provider. `/how-it-works` explains the
model with a diagram.

## MCP authorization

Each account owns one resource and endpoint, `/api/agents/<agentId>/mcp`. All clients share the
account's balance, rules and budget, but each holds a separate owner-signed grant.

- **Connect a client**: add the endpoint to Codex, OpenClaw or another client, sign in, and sign
  that client's grant (who and until when; the consent screen shows the rules it will act under).
  Or name a client and issue its one-time `mcp_` key after signing; keys are hashed, shown once
  and expire after 30 days.
- **Tokens**: OAuth tokens bind the account audience, the verified client ID and an immutable
  client-access generation. Reconnecting creates a new generation; revoked tokens never follow it.
- **Tools**: the same Intents and confidential operations the dashboard has. Native transfers,
  owner signing and policy changes are excluded.
- **Revocation**: blocks access immediately, invalidates credentials and prepares the
  owner-signed grant revocation. Canceled signing leaves access blocked and offers a retry. Other
  clients keep their grants.
- **Protocols**: MCP `2025-06-18` (`initialize`, stateless Streamable HTTP) and `2026-07-28`
  (`server/discover`, per-request envelopes) on the same endpoint. Better Auth handles OAuth,
  resource-bound JWT verification, CIMD and an explicitly enabled DCR fallback.

> [!NOTE]
> Preparing a grant creates no execution authority. OAuth consent also needs the owner-signed
> grant; a browser session alone cannot mint execution access. The demo's API key stays server-side.

## Architecture

```text
app/            routes and layouts; every protected page resolves a session
features/       vertical slices: UI, hooks and a per-feature api.ts (HTTP only, no credentials)
components/     shared UI and shadcn primitives
lib/agent-api/  server bridge to the SDK
lib/auth/       Better Auth instance, sessions, owner identity
lib/near/       the single NEAR Connect instance (login and owner signing)
lib/mcp/        account resources, client access and tools
lib/db/         Drizzle schema; drizzle/ holds migrations
```

One Better Auth client (`lib/auth/client.ts`) carries every login method: SIWE for EVM (injected
wallets only, no WalletConnect), passkeys for platform authenticators and SIWN for NEAR through
a client plugin that drives the same NEAR Connect instance used for owner signing. Server hooks
require a NEAR login to name this app's host and record the EVM public key at SIWE login.

Chain icons are local under `public/assets/chains`. Token art is looked up by asset id, then
symbol (`lib/assets/`), loaded from public image CDNs with no referrer, and falls back to a monogram.

## Development

```sh
pnpm typecheck
pnpm lint
pnpm test                 # unit + integration (PGlite, no services)
```

`pnpm test:postgres` and `pnpm test:http` need a real database: copy `tests/.env.example` to
`tests/.env`, run `pnpm docker:up` and create the `near_intents_agent_demo_test` database
(`test:http` builds the app and creates and drops its own database on the same server).

After a new SDK release, raise `@near-intents-agent-api/sdk` in `package.json`, run
`pnpm typecheck` and fix any drift that `lib/agent-api/schemas.ts` reports.

## Related

[api](https://github.com/NEAR-Intents-Agent-API/api) ·
[sdk-typescript](https://github.com/NEAR-Intents-Agent-API/sdk-typescript) ·
[agent-connect](https://github.com/NEAR-Intents-Agent-API/agent-connect) ·
[examples](https://github.com/NEAR-Intents-Agent-API/examples) ·
[skills](https://github.com/NEAR-Intents-Agent-API/skills)
