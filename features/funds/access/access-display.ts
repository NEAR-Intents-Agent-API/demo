import type { AccessView } from "@/lib/agent-api/access";

/** A moment with date and time in the owner's own time zone. */
export function accessDateTime(value: string, locale?: string, timeZone?: string): string {
  return new Date(value).toLocaleString(locale, {
    dateStyle: "medium",
    timeStyle: "short",
    timeZone,
  });
}

/** When the grant ends or ended, in words: "until …", "expired …" or "revoked …". */
export function accessWhen(
  access: Pick<AccessView, "status" | "expiresAt" | "revokedAt">,
  locale?: string,
  timeZone?: string,
): string {
  if (access.status === "revoked" && access.revokedAt)
    return `revoked ${accessDateTime(access.revokedAt, locale, timeZone)}`;
  const when = accessDateTime(access.expiresAt, locale, timeZone);
  return access.status === "active" ? `until ${when}` : `expired ${when}`;
}

export const ACCESS_STATUS_LABEL = {
  active: "Active",
  expired: "Expired",
  revoked: "Revoked",
} as const;

/**
 * Why the dashboard has no access right now: its newest grant (the one that decides, since an
 * ended grant never restores an older one) has ended. `olderActive` counts older dashboard grants
 * that are still valid on the account but can no longer be used from here. `null` when the
 * dashboard has no grant at all or its newest one is active.
 */
export function endedDashboardAccess(
  grants: readonly AccessView[],
): { grant: AccessView; olderActive: number } | null {
  const mine = grants.filter((grant) => grant.holder === "dashboard");
  const newest = mine.reduce<AccessView | null>(
    (best, grant) =>
      !best || Date.parse(grant.issuedAt) > Date.parse(best.issuedAt) ? grant : best,
    null,
  );
  if (!newest || newest.status === "active") return null;
  return {
    grant: newest,
    olderActive: mine.filter((grant) => grant !== newest && grant.status === "active").length,
  };
}
