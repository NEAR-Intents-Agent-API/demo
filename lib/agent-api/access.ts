import type { GrantView } from "@near-intents-agent-api/sdk";

export type AccessStatus = "active" | "expired" | "revoked";

/** Who holds the grant: this dashboard, or a connected client or another app. */
export type AccessHolder = "dashboard" | "client";

/** An owner grant as the dashboard shows it: who holds it, until when, and whether it still works. The account rules say what it may do. */
export type AccessView = {
  grantId: string;
  /** The owner-signed name of the grant, e.g. "Dashboard". */
  label: string;
  issuedAt: string;
  expiresAt: string;
  status: AccessStatus;
  /** When the owner revoked it; null unless `status` is `revoked`. */
  revokedAt: string | null;
  holder: AccessHolder;
};

export function accessStatus(grant: GrantView, now: number = Date.now()): AccessStatus {
  if (grant.revoked_at !== null) return "revoked";
  return Date.parse(grant.expires_at) <= now ? "expired" : "active";
}

export function accessView(
  grant: GrantView,
  holder: AccessHolder = "client",
  now: number = Date.now(),
): AccessView {
  return {
    grantId: grant.grant_id,
    label: grant.label,
    issuedAt: grant.issued_at,
    expiresAt: grant.expires_at,
    status: accessStatus(grant, now),
    revokedAt: grant.revoked_at,
    holder,
  };
}

/**
 * Every grant on an account, active ones first and then the ended ones. Within each group the
 * API's order (newest first) is kept, so a revoked or expired grant stays visible instead of
 * disappearing. `dashboardCommitments` are the token commitments this dashboard itself holds.
 */
export function accessViews(
  grants: readonly GrantView[],
  dashboardCommitments: ReadonlySet<string>,
  now: number = Date.now(),
): AccessView[] {
  const views = grants.map((grant) =>
    accessView(
      grant,
      dashboardCommitments.has(grant.owner_message.credential) ? "dashboard" : "client",
      now,
    ),
  );
  return [
    ...views.filter((view) => view.status === "active"),
    ...views.filter((view) => view.status !== "active"),
  ];
}
