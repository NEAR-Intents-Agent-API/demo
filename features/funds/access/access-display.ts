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
