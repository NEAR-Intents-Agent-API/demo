import type { StatusResponse } from "@near-intents-agent-api/sdk";

type CreateDetails = Extract<StatusResponse, { type: "agent_create" }>["details"];
export type GrantInstall = NonNullable<CreateDetails["grant_install"]>;

/**
 * Whether the first grant signed with an account came to exist. Null for any other operation,
 * an account created without a grant, or one that is not live yet.
 */
export function grantInstall(operation: StatusResponse): GrantInstall | null {
  // Operations read before this field existed carry no `grant_install` at all.
  return operation.type === "agent_create" ? (operation.details?.grant_install ?? null) : null;
}

/**
 * Why the dashboard has no access after its account went live, in plain words; null when the
 * grant was installed or never asked for. The account exists either way: the owner issues the
 * access again in the Access step.
 */
export function grantInstallRefusal(install: GrantInstall | null): string | null {
  switch (install) {
    case "refused:grant_credential_reused":
      return "The key for dashboard access was already used by another account setup, so the API did not install it.";
    case "refused:grant_expired":
      return "Dashboard access ended before the account went live, so the API did not install it.";
    default:
      return null;
  }
}
