import type { GrantView } from "@near-intents-agent-api/sdk";

/** A live owner grant as the dashboard shows it: who holds it and until when. The account rules say what it may do. */
export type AccessView = {
  grantId: string;
  /** The owner-signed name of the grant, e.g. "Dashboard". */
  label: string;
  issuedAt: string;
  expiresAt: string;
};

export function accessView(grant: GrantView): AccessView {
  return {
    grantId: grant.grant_id,
    label: grant.label,
    issuedAt: grant.issued_at,
    expiresAt: grant.expires_at,
  };
}
