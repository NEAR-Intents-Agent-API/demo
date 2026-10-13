import assert from "node:assert/strict";
import test from "node:test";
import type { GrantView, StatusResponse } from "@near-intents-agent-api/sdk";
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

test("a revoke reports the operations already committed", () => {
  const revoke = (ids: string[] | null, truncated: boolean | null) =>
    ({
      type: "grant_revoke",
      details: { grant_id: "g", committed_correlation_ids: ids, committed_truncated: truncated },
    }) as unknown as StatusResponse;
  assert.equal(committedAfterRevoke(null), null);
  assert.equal(committedAfterRevoke(revoke(null, null)), null);
  assert.equal(committedAfterRevoke(revoke([], false)), null);
  assert.deepEqual(committedAfterRevoke(revoke(["op_a", "op_b"], true)), {
    ids: ["op_a", "op_b"],
    truncated: true,
  });
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
