"use client";

import { Loading, Unavailable } from "@/components/shared/states";
import { Button } from "@/components/ui/button";
import { useGrants, useWorkloadGrantFlow } from "@/features/funds";
import { AccessList } from "./access-row";
import { PolicyManagementSection } from "./policy-management-section";

/**
 * Everyone who can act for this account right now: the dashboard, each connected client, each
 * workload and any other signed grant. Management lives where the connection was made — the
 * Wallet tab for the dashboard, Connect for clients — so this panel cannot offer a revoke that
 * silently kills a different credential than the one on screen. Workloads are the exception:
 * they hold their own identity, so they are added and revoked here.
 */
export function AccessSummary({ agentId }: { agentId: string }) {
  const grants = useGrants(agentId);
  const all = grants.view.data?.data ?? [];
  const workloads = useWorkloadGrantFlow(agentId, grants.view.data?.audience ?? "");
  return (
    <PolicyManagementSection
      title="Account access"
      description="Each connection has its own grant. Every grant can do exactly what the account rules allow, sharing one budget."
      actions={
        grants.view.data ? (
          <Button
            variant="outline"
            size="sm"
            disabled={workloads.busy}
            onClick={workloads.openForm}
          >
            Add workload
          </Button>
        ) : undefined
      }
    >
      {grants.view.isPending ? (
        <Loading rows={2} />
      ) : grants.view.error || !grants.view.data ? (
        <Unavailable
          code={grants.view.error?.message ?? "request_failed"}
          onRetry={() => void grants.view.refetch()}
        />
      ) : all.length ? (
        <AccessList grants={all} onRevoke={workloads.revoke} revoking={workloads.revoking} />
      ) : (
        <div className="space-y-1">
          <p className="text-sm">No active grants</p>
          <p className="text-xs leading-5 text-muted-foreground">
            Sign a dashboard grant in Wallet, connect a client in Connect or add a workload here.
          </p>
        </div>
      )}
      {all.length ? (
        <p className="mt-3 text-xs leading-5 text-muted-foreground">
          Manage dashboard access in Wallet, clients in Connect and workloads here.
        </p>
      ) : null}
      {workloads.dialogs}
    </PolicyManagementSection>
  );
}
