import assert from "node:assert/strict";
import { test } from "node:test";
import { endedDashboardAccess } from "../../features/funds/access/access-display";
import type { AccessView } from "../../lib/agent-api/access";

const grant = (overrides: Partial<AccessView>): AccessView => ({
  grantId: "g",
  label: "Dashboard",
  issuedAt: "2026-10-01T00:00:00Z",
  expiresAt: "2026-11-01T00:00:00Z",
  status: "active",
  revokedAt: null,
  holder: "dashboard",
  ...overrides,
});

test("an ended newest dashboard grant is reported even while an older one is active", () => {
  // Active grants are listed first, so the ended newest one is not at the front.
  const grants = [
    grant({ grantId: "old", issuedAt: "2026-10-01T00:00:00Z" }),
    grant({
      grantId: "new",
      issuedAt: "2026-10-10T00:00:00Z",
      status: "revoked",
      revokedAt: "2026-10-11T00:00:00Z",
    }),
  ];
  const ended = endedDashboardAccess(grants);
  assert.equal(ended?.grant.grantId, "new");
  assert.equal(ended?.olderActive, 1);
});

test("nothing is reported when the newest dashboard grant is active or there is none", () => {
  assert.equal(endedDashboardAccess([]), null);
  assert.equal(endedDashboardAccess([grant({ holder: "client", status: "revoked" })]), null);
  assert.equal(
    endedDashboardAccess([
      grant({ grantId: "old", status: "expired" }),
      grant({ grantId: "new", issuedAt: "2026-10-10T00:00:00Z" }),
    ]),
    null,
  );
});
