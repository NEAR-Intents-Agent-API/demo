<!-- BEGIN:nextjs-agent-rules -->

# This is NOT the Next.js you know

This version has breaking changes — APIs, conventions, and file structure may all differ from your training data. Read the relevant guide in `node_modules/next/dist/docs/` (resolved from this file's directory; in monorepos the `next` package may not be visible from the repo root) before writing any code. Heed deprecation notices.

This block is written and re-added by `next dev` — verify at `node_modules/next/dist/server/lib/generate-agent-files.js`. Removing it from a diff only re-creates the uncommitted change; committing it with your work keeps the tree clean.

<!-- END:nextjs-agent-rules -->

# Demo app conventions

The owner dashboard and MCP/OAuth server. Next.js App Router + Better Auth + TanStack Query,
with shadcn/ui primitives. Read the Next docs in `node_modules/next/dist/docs/` first; route
handlers, server/client components and caching changed in this version.

## Layout

```text
app/                      routes and layouts only; every protected page resolves a session
components/
  ui/                     shadcn primitives (source of truth; keep compound files intact)
  shared/                 domain-free app UI: callout, choice, disclosure, identifiers, states, page, status
  shell/                  dashboard chrome: command palette
  providers.tsx           provider composition (wagmi, query, session boundary)
  responsive-dialog.tsx   app-wide Drawer-on-mobile / Dialog-on-desktop
features/
  agents/                 api/ + model/ + components/;
    agent-list/           workspace screen, create-agent two-step dialog, hooks
    agent-detail/         account screen, header, tabs/ (wallet, activity), hooks
  wallet/                 signing ceremony and consent; approvals/ (owner vote), components/, model/
  funds/                  flows/ (review card, flow shell), access/, deposit/, swap/, send/,
                          withdraw/, private/, portfolio/, operations/, model/
  policy/                 rules/ (editor sections, summary), policy-tab/ (budget, delay, access)
  mcp/                    connect/, consent/, activity/, hooks/
  auth/                   login panel, providers, session client actions
  assets/                 token/chain catalogue, filters and pickers (CatalogProvider)
  intents/                prepared-intent lifecycle: sign/submit and observe
  home/                   marketing surface
lib/
  agent-api/              server SDK bridge (credentials never leave the server)
  auth/                   Better Auth instance, session, owner identity
  near/wallet.ts          the ONE NEAR Connect instance (login + owner signing)
  evm/wallet.ts           wagmi config from RainbowKit connectorsForWallets (injected only)
  http/, query/, mcp/, db/, config/, format/
```

## Boundaries

- Import rules are enforced by `apps/demo/tests/unit/architecture.test.ts`. Features may import
  their own files and shared modules; cross-feature imports must use the feature's `index.ts`
  (or its deliberate `data` / `model` entry). `components/` and `lib/` must never import
  `features/`.
- One feature owns one screen's data. A query key comes from `lib/query/keys.ts`; a mutation
  invalidates through the same factory, never a literal array.
- Endpoint functions (`features/*/api.ts`) do HTTP only: no toasts, no navigation, no cache
  writes. Query/mutation hooks own cache identity and synchronization; components own events.
- `lib/near/wallet.ts` is the only NEAR Connect instance. Login and owner signing must share it;
  a second connector duplicates global listeners and wallet storage. Never cache the wallet
  object across ceremonies without checking its account against the server's signer.
- `lib/evm/wallet.ts` must stay WalletConnect-free: `injected()` (EIP-6963 discovery),
  `coinbaseWallet` and `safe()` only. Never add `walletConnect()` or the MetaMask SDK connector.
  Wallet selection is our own `features/auth/evm-wallet-picker.tsx`, built on wagmi's
  `useConnectors`/`useConnect`.
- Owner ceremonies are server-prepared: the browser signs exactly the payload from
  `generateIntent`/workflow routes. Do not compose signed messages in the client.

## State

- Server state lives in TanStack Query (`lib/query/client.ts` defaults). Session identity comes
  from `authClient.useSession()` and the server-resolved props; do not poll `/api/auth/session`.
- Pending intents/operations are observed with `features/intents/observe.ts` (long-poll,
  AbortSignal, one terminal-status rule). Do not add `setInterval` poll loops.
- The token catalogue is mounted once in `CatalogProvider`; read it with `useCatalog()`, never
  mount `useCatalogData()` in a screen.

## Checks

`pnpm --filter demo typecheck`, `pnpm exec biome check apps/demo`, `pnpm --filter demo test`
(unit + integration), `pnpm --filter demo test:postgres`, `pnpm --filter demo test:http`,
`pnpm --filter demo build`.
