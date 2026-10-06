# NEAR Intents Agent API demo

Next.js owner dashboard and MCP/OAuth server built on [`@near-intents-agent-api/sdk`](https://www.npmjs.com/package/@near-intents-agent-api/sdk). It is an ordinary API client of the NEAR Intents Agent API.

```dotenv
NEAR_INTENTS_AGENT_API_URL=http://localhost:3000
NEAR_INTENTS_AGENT_API_KEY=naa___

DATABASE_URL=postgresql://near_intents_agent_demo:YOUR_PASSWORD@localhost:5435/near_intents_agent_demo

SECRET_ENCRYPTION_KEY=YOUR_SECRET_ENCRYPTION_KEY

BETTER_AUTH_SECRET=YOUR_BETTER_AUTH_SECRET
```

Copy `.env.example` to `.env`. Replace `naa___` with a real
server-only developer API key. `pnpm docker:up` starts a local Postgres (`docker-compose.yml`) with `near_intents_agent_demo` as
database, user and password on port `5435`; use that password in place of `YOUR_PASSWORD`.
Set `SECRET_ENCRYPTION_KEY` and `BETTER_AUTH_SECRET` to separate 32–64 character secrets, each generated with
`openssl rand -hex 32`. Then `pnpm dev` (applies migrations first). Production: `pnpm build`, `pnpm start`; run `pnpm db:migrate`
before each deploy. The demo database holds login, passkeys, OAuth/MCP records and owner-intent
correlation records, separate from the API database.

Serve over HTTPS on one stable hostname; the proxy must overwrite `Host`/`X-Forwarded-Host`.
Auth URL, passkey relying party and MCP resource URLs derive from that host, so changing it
changes passkey scope, sessions and OAuth resources. Better Auth uses `BETTER_AUTH_SECRET`
directly for session and MCP cryptography. Keep it stable to preserve sessions and MCP
authorizations. Changing the API key, API URL or app origin does not change this secret.

**User flow.**

1. Sign in with an EVM wallet, NEAR wallet or passkey.
2. Create an agent: name, rules, one signature. Rules are plain-language sections (what it can
   do, which tokens, the most one move may spend, where funds can go, owner approval) that map
   to the account policy in `features/policy/rules/rules.ts`; new agents can do everything NEAR
   Intents offers (swap, send, withdraw to any network, private balance).
   Deposits are always enabled, with no creation toggle or policy control. The dialog waits until
   it is live; an interrupted activation resumes.
3. The agent page has three tabs. **Wallet** shows holdings with USD values (public and
   private) beside five tabs: swap, transfer (to another NEAR Intents account), deposit (a
   one-time 1Click address for a chosen network, token and amount, or a transfer from any NEAR
   Intents account), withdraw, and shield/unshield. Swap, transfer, deposit and withdraw each
   choose the public or private balance. A flow the rules forbid says so instead of failing at
   the provider; spending buttons ask for "Moving funds" when needed. Deposit addresses work
   without a dashboard grant. **Activity** lists operations and anything waiting on the
   owner. **Rules** shows the rules in force, edits them in place, and holds the emergency stop,
   USD budget and execution delay.
4. Deposits need only the signed-in owner's session. Public and confidential address creation
   requires no grant signature; refund addresses are entered directly and validated on the source
   chain. Swaps, sends, withdrawals and shield/unshield need "Authorize dashboard": one owner
   signature on a `grant_issue` for the dashboard's own grant token with a 1, 7 or 30 day expiry.
   The dialog shows the live account rules: that is exactly what the dashboard may do, and what
   every other grant may do too. The agent's native chain addresses are never offered for deposits: only NEAR
   Intents balances are usable. The dashboard reads its live grant from the Agent API for spending
   (`GET /api/agents/:id/access`) and runs the same tool set as an MCP client under it.
   Withdrawals and sends only reach destinations the account's destination rule allows ("Where
   can funds go?" in Rules, or "Destinations" on the wallet). A new account starts with an empty
   "Only these" list; approving a destination is one off-chain signature that every grant uses at
   once, with no new grant.
5. Open the account’s **Connect** tab. Add its shared MCP endpoint to Codex, OpenClaw or another
   client, sign in and sign that client’s grant (who and until when; the consent screen shows the
   account rules it will act under). Alternatively, name a client and issue its one-time `mcp_`
   key after signing. Clients follow the same rules as the dashboard.
6. Manage each client’s authorization, expiry and last use in Connect; inspect calls in Activity.

`/how-it-works` explains the model with a diagram. Chain icons are local under
`public/assets/chains`; the token catalogue (symbol, chain, decimals, USD price) is the Agent
API's public `GET /v1/tokens`, proxied at `/api/tokens`; token art is looked up by asset id, then symbol
(`lib/assets/`), loaded from public image CDNs with no referrer, and falls back to a monogram.

**MCP authorization.** Each account owns one resource and endpoint,
`/api/agents/<agentId>/mcp`. All clients use that endpoint, sharing account balance, rules and
budget, but each holds a separate owner-signed grant. OAuth tokens bind the account audience,
verified client ID and immutable client-access generation. Reconnecting creates a new generation;
revoked tokens never follow it. API keys are hashed, shown once and expire after 30 days.
Owner grant tokens remain sealed with `SECRET_ENCRYPTION_KEY`. Tools keep the existing Intents
and confidential operations; native transfers, owner signing and policy changes stay excluded.

Demo and Agent Connect accept both MCP `2025-06-18` and `2026-07-28` on their existing
endpoints. The official SDK selects the protocol from each request: 2025 clients use
`initialize` and stateless Streamable HTTP; 2026 clients use `server/discover` and per-request
envelopes. Better Auth handles OAuth, resource-bound JWT verification, CIMD, and explicitly
enabled DCR fallback for older clients. Both protocols enforce the same live grants and client
revocation checks; no protocol selection or separate credentials are needed.

Grant preparation creates no execution authority. OAuth consent also requires the client’s
owner-signed grant; browser sessions alone cannot mint execution access. Canceled signing leaves
access pending. Interrupted submissions are reconciled using their persisted correlation ID.

Revoking a client blocks access immediately, invalidates its credentials and prepares the
owner-signed grant revocation. Canceled or failed completion leaves access blocked and offers a
retry. Other clients and dashboard access retain their grants. The demo’s API key stays
server-side. Legacy client endpoints are removed; migration invalidates their access while
preserving accounts and attributed tool history. Existing clients must reconnect.

Code layout: `app/` routes, `features/` vertical UI + hooks + per-feature `api.ts` endpoints (no
credentials), `components/` shared UI, `lib/agent-api/` server SDK bridge, `lib/auth/` sessions and
Better Auth instance, `lib/near/wallet.ts` the single NEAR Connect instance for login and owner
signing, `lib/mcp/` account resources and client access and tools, `lib/db/` + `drizzle/` storage.

Auth providers use Better Auth's own client actions: SIWE for EVM (RainbowKit injected-only
connectors, no WalletConnect), passkeys for platform authenticators, and SIWN for NEAR driven by
the app's own NEAR Connect instance so login and owner signing share one wallet selection. The
demo's own routes are only `evm-key` (public-key metadata), `session` and `sign-out`.

## Development

Needs Node.js 24+, pnpm and Docker.

```sh
pnpm install
pnpm typecheck
pnpm lint
pnpm test                 # unit + integration (PGlite, no services)
```

`pnpm test:postgres` and `pnpm test:http` need a real database: copy `tests/.env.example` to
`tests/.env`, run `pnpm docker:up`, and create the `near_intents_agent_demo_test` database
(`test:http` builds the app and creates and drops its own database under the same server).
After a new SDK release, raise `@near-intents-agent-api/sdk` in `package.json`, run
`pnpm typecheck`, and fix any drift `lib/agent-api/schemas.ts` reports.
