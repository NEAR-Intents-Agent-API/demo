import assert from "node:assert/strict";
import test from "node:test";
import type { GrantView, StatusResponse } from "@near-intents-agent-api/sdk";
import {
  createWorkloadKey,
  jwkThumbprintUri as sdkThumbprintUri,
} from "@near-intents-agent-api/sdk";
import { accessWhen } from "../../features/funds/access/access-display";
import { accessProblems } from "../../features/funds/access/access-form-utils";
import { accessViews } from "../../lib/agent-api/access";
import { grantExpiryProblem, grantLabelProblem } from "../../lib/agent-api/access-input";
import { committedAfterRevoke } from "../../lib/agent-api/committed";
import { mcpClientNameProblem, mcpGrantLabel } from "../../lib/mcp/client-name";

const now = Date.parse("2026-10-13T12:00:00Z");
const DAY = 24 * 60 * 60 * 1000;

test("a grant label is 1 to 64 printable ASCII characters", () => {
  assert.equal(grantLabelProblem("Dashboard"), null);
  assert.equal(grantLabelProblem("x".repeat(64)), null);
  assert.match(grantLabelProblem("") ?? "", /Name this access/);
  assert.match(grantLabelProblem("   ") ?? "", /Name this access/);
  assert.match(grantLabelProblem("x".repeat(65)) ?? "", /at most 64 characters \(this is 65\)/);
  assert.match(grantLabelProblem("Café") ?? "", /plain letters/);
  assert.match(grantLabelProblem("a·b") ?? "", /plain letters/);
});

test("an expiry must be in the future and within 365 days", () => {
  assert.equal(grantExpiryProblem(now + DAY, now), null);
  assert.equal(grantExpiryProblem(now + 365 * DAY, now), null);
  assert.match(grantExpiryProblem(Number.NaN, now) ?? "", /Choose an expiry/);
  assert.match(grantExpiryProblem(now - 1, now) ?? "", /in the past/);
  assert.match(grantExpiryProblem(now + 60 * 1000, now) ?? "", /at least 5 minutes/);
  assert.match(grantExpiryProblem(now + 366 * DAY, now) ?? "", /at most 365 days/);
});

test("the form checks the label and the chosen or custom expiry", () => {
  const input = { label: "Dashboard", duration: 7, custom: "" } as const;
  assert.deepEqual(accessProblems(input, now), { label: null, expiry: null });
  assert.match(accessProblems({ ...input, duration: "custom" }, now).expiry ?? "", /Choose/);
  assert.match(
    accessProblems({ ...input, duration: "custom", custom: "2026-10-12T10:00" }, now).expiry ?? "",
    /past/,
  );
  assert.match(
    accessProblems({ ...input, duration: "custom", custom: "2028-01-01T10:00" }, now).expiry ?? "",
    /365/,
  );
  assert.equal(
    accessProblems({ ...input, duration: "custom", custom: "2026-11-01T10:00" }, now).expiry,
    null,
  );
  assert.match(accessProblems({ ...input, label: "x".repeat(70) }, now).label ?? "", /at most 64/);
});

const grant = (id: string, patch: Partial<GrantView>): GrantView =>
  ({
    grant_id: id,
    label: id,
    issued_at: "2026-10-01T00:00:00Z",
    expires_at: "2026-11-01T00:00:00Z",
    revoked_at: null,
    credential_type: "token",
    owner_message: { credential: `commitment-${id}` },
    ...patch,
  }) as unknown as GrantView;

test("revoked and expired grants stay listed, after the active ones", () => {
  const views = accessViews(
    [
      grant("revoked", { revoked_at: "2026-10-10T08:30:00Z" }),
      grant("expired", { expires_at: "2026-10-12T00:00:00Z" }),
      grant("live-a", {}),
      grant("both", { revoked_at: "2026-10-09T00:00:00Z", expires_at: "2026-10-11T00:00:00Z" }),
      grant("live-b", {}),
    ],
    new Set(["commitment-live-a"]),
    now,
  );
  assert.deepEqual(
    views.map((view) => [view.grantId, view.status]),
    [
      ["live-a", "active"],
      ["live-b", "active"],
      ["revoked", "revoked"],
      ["expired", "expired"],
      ["both", "revoked"],
    ],
  );
  assert.equal(views[0]?.holder, "dashboard");
  assert.equal(views[1]?.holder, "client");
  assert.equal(views[2]?.revokedAt, "2026-10-10T08:30:00Z");
});

test("access text carries date and time", () => {
  const base = { expiresAt: "2026-10-20T14:05:00Z", revokedAt: null };
  assert.equal(
    accessWhen({ ...base, status: "active" }, "en-US", "UTC"),
    "until Oct 20, 2026, 2:05 PM",
  );
  assert.equal(
    accessWhen({ ...base, status: "expired" }, "en-US", "UTC"),
    "expired Oct 20, 2026, 2:05 PM",
  );
  assert.equal(
    accessWhen({ ...base, status: "revoked", revokedAt: "2026-10-13T09:00:00Z" }, "en-US", "UTC"),
    "revoked Oct 13, 2026, 9:00 AM",
  );
});

test("a revoke reports the operations and cancels already committed", () => {
  const revoke = (
    ids: string[] | null,
    cancels: { order_id: string | null; committed_at: string }[] | null,
    truncated: boolean | null,
  ) =>
    ({
      type: "grant_revoke",
      details: {
        grant_id: "g",
        committed_correlation_ids: ids,
        committed_cancellations: cancels,
        committed_truncated: truncated,
      },
    }) as unknown as StatusResponse;
  const at = "2026-11-13T10:00:00Z";
  assert.equal(committedAfterRevoke(null), null);
  assert.equal(committedAfterRevoke(revoke(null, null, null)), null);
  assert.equal(committedAfterRevoke(revoke([], [], false)), null);
  assert.deepEqual(committedAfterRevoke(revoke(["op_a", "op_b"], null, true)), {
    ids: ["op_a", "op_b"],
    cancellations: [],
    truncated: true,
  });
  // A cancel alone is enough to warn, and a null order id cancels every open order.
  assert.deepEqual(
    committedAfterRevoke(
      revoke(
        [],
        [
          { order_id: "order_1", committed_at: at },
          { order_id: null, committed_at: at },
        ],
        false,
      ),
    ),
    {
      ids: [],
      cancellations: [
        { orderId: "order_1", committedAt: at },
        { orderId: null, committedAt: at },
      ],
      truncated: false,
    },
  );
  assert.equal(
    committedAfterRevoke({ type: "agent_archive", details: {} } as unknown as StatusResponse),
    null,
  );
});

test("an MCP client name fits the signed label with its prefix", () => {
  assert.equal(mcpClientNameProblem("Codex"), null);
  assert.equal(mcpClientNameProblem("c".repeat(59)), null);
  assert.match(mcpClientNameProblem("c".repeat(60)) ?? "", /at most 59 characters/);
  assert.match(mcpClientNameProblem(" ") ?? "", /Name this client/);
  assert.match(mcpClientNameProblem("Clé") ?? "", /plain letters/);
  assert.equal(mcpGrantLabel("Codex"), "MCP: Codex");
  assert.equal(mcpGrantLabel("c".repeat(59)).length, 64);
  // A name an OAuth client chose for itself is made signable, never cut without a mark.
  assert.equal(mcpGrantLabel("c".repeat(80)), `MCP: ${"c".repeat(56)}...`);
  assert.equal(mcpGrantLabel("Clé"), "MCP: Cl?");
});

const oidcIssuer = "https://token.actions.githubusercontent.com";

test("a workload grant lists its kind and what the owner signed, and is never the dashboard's", () => {
  const { publicJwk } = createWorkloadKey("P-256");
  const views = accessViews(
    [
      grant("ci", {
        credential_type: "oidc",
        owner_message: {
          credential: {
            type: "oidc",
            issuer: oidcIssuer,
            audience: "https://api.example.com/v1/agents/a1",
            claims: { repository_owner_id: "1", repository_id: "2", environment: "production" },
          },
        },
      } as unknown as Partial<GrantView>),
      grant("server", {
        credential_type: "public_key",
        owner_message: { credential: { type: "public_key", jwk: publicJwk } },
      } as unknown as Partial<GrantView>),
      grant("token", {}),
    ],
    // A commitment can never equal an object credential, so no workload is the dashboard's.
    new Set(["commitment-token"]),
    now,
  );
  assert.deepEqual(
    views.map((view) => [view.grantId, view.kind, view.holder]),
    [
      ["ci", "oidc", "client"],
      ["server", "public_key", "client"],
      ["token", "token", "dashboard"],
    ],
  );
  assert.deepEqual(views[0]?.binding, {
    type: "oidc",
    issuer: oidcIssuer,
    platform: "GitHub Actions",
    audience: "https://api.example.com/v1/agents/a1",
    claims: [
      { name: "repository_owner_id", value: "1" },
      { name: "repository_id", value: "2" },
      { name: "environment", value: "production" },
    ],
    signedKeys: [],
  });
  // The dashboard's thumbprint is the SDK's: it is what the workload signs its assertions with.
  assert.deepEqual(views[1]?.binding, {
    type: "public_key",
    curve: "P-256",
    thumbprint: sdkThumbprintUri(publicJwk),
  });
  assert.equal(views[2]?.binding, null);
});

test("a credential this build cannot read lists its kind and no binding", () => {
  const [view] = accessViews(
    [
      grant("future", {
        credential_type: "oidc",
        owner_message: { credential: { type: "oidc", issuer: oidcIssuer, new_field: 1 } },
      } as unknown as Partial<GrantView>),
    ],
    new Set(),
    now,
  );
  assert.equal(view?.kind, "oidc");
  assert.equal(view?.binding, null);
});
