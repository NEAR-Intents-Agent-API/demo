"use client";

import { Loading, Unavailable } from "@/components/shared/states";
import { useGrants } from "@/features/funds";
import { AccessList } from "./access-row";
import { PolicyManagementSection } from "./policy-management-section";

/**
 * Everyone who can act for this account right now: the dashboard, each connected client and any
 * other signed grant. It is a read: management lives where the connection was made — the Wallet
 * tab for the dashboard, Connect for clients — so this panel cannot offer a revoke that silently
 * kills a different credential than the one on screen.
 */
export function AccessSummary({ agentId }: { agentId: string }) {
  const grants = useGrants(agentId);
  const all = grants.view.data?.data ?? [];
  return (
    <PolicyManagementSection
      title="Account access"
      description="Each connection has its own grant. Every grant can do exactly what the account rules allow, sharing one budget."
    >
      {grants.view.isPending ? (
        <Loading rows={2} />
      ) : grants.view.error || !grants.view.data ? (
        <Unavailable
          code={grants.view.error?.message ?? "request_failed"}
          onRetry={() => void grants.view.refetch()}
        />
      ) : all.length ? (
        <AccessList grants={all} />
      ) : (
        <div className="space-y-1">
          <p className="text-sm">No active grants</p>
          <p className="text-xs leading-5 text-muted-foreground">
            Sign a dashboard grant in Wallet or connect a client in Connect.
          </p>
        </div>
      )}
      {all.length ? (
        <p className="mt-3 text-xs leading-5 text-muted-foreground">
          Manage dashboard access in Wallet and clients in Connect.
        </p>
      ) : null}
    </PolicyManagementSection>
  );
}
