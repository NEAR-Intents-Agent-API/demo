"use client";

import { useQuery } from "@tanstack/react-query";
import { Callout } from "@/components/shared/callout";
import { Button } from "@/components/ui/button";
import { grantInstall, grantInstallRefusal } from "@/lib/agent-api/grant-install";
import { queryKeys } from "@/lib/query/keys";
import { agentsApi } from "../../api/agents-api";

/**
 * Said plainly when the signature that created the account could not also install the dashboard's
 * grant. The account is live either way, so the notice offers the Access step, which issues the
 * grant with a second signature. It reads the account's creation request and stays quiet when
 * that cannot be read or the dashboard already has access.
 */
export function GrantInstallNotice({
  agentId,
  hasAccess,
  onAuthorize,
}: {
  agentId: string;
  hasAccess: boolean;
  onAuthorize: () => void;
}) {
  const onboarding = useQuery({
    queryKey: queryKeys.onboarding(agentId),
    queryFn: ({ signal }) => agentsApi.onboarding(agentId, signal),
    enabled: !hasAccess,
  });
  const reason = onboarding.data
    ? grantInstallRefusal(grantInstall(onboarding.data.operation))
    : null;
  if (hasAccess || !reason) return null;
  return (
    <Callout
      tone="warning"
      title="Your account is active, but the dashboard has no access yet"
      action={
        <Button variant="outline" size="sm" onClick={onAuthorize}>
          Authorize dashboard
        </Button>
      }
    >
      {reason} Authorize the dashboard again with one more signature.
    </Callout>
  );
}
