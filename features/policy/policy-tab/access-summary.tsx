"use client";

import { Loading, Unavailable } from "@/components/shared/states";
import { useGrants } from "@/features/funds";
import { PolicyManagementSection } from "./policy-management-section";

/**
 * Everyone who can act for this account right now: the dashboard, each connected client and any
 * other signed grant. It is a read: management lives where the connection was made — the Wallet
 * tab for the dashboard, Connect for clients — so this panel cannot offer a revoke that silently
 * kills a different credential than the one on screen.
 */
export function AccessSummary({ agentId }: { agentId: string }) {
  const grants = useGrants(agentId);
  const active = grants.view.data?.data ?? [];
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
      ) : active.length ? (
        <div>
          <p className="mb-2 text-sm">{active.length} active grants</p>
          <ul className="divide-y">
            {active.map((grant) => (
              <li
                key={grant.grantId}
                className="flex flex-wrap items-start justify-between gap-x-4 gap-y-2 py-3"
              >
                <div className="min-w-0 flex-1">
                  <p className="text-sm font-medium">{grant.label}</p>
                  <p className="mt-1 text-xs leading-5 break-words text-muted-foreground">
                    {"Account rules apply · until "}
                    {new Date(grant.expiresAt).toLocaleDateString(undefined, {
                      month: "short",
                      day: "numeric",
                    })}
                  </p>
                </div>
                <span className="text-xs text-muted-foreground">
                  {grant.label.toLowerCase().includes("dashboard") ? "This dashboard" : "Client"}
                </span>
              </li>
            ))}
          </ul>
        </div>
      ) : (
        <div className="space-y-1">
          <p className="text-sm">No active grants</p>
          <p className="text-xs leading-5 text-muted-foreground">
            Sign a dashboard grant in Wallet or connect a client in Connect.
          </p>
        </div>
      )}
      {active.length ? (
        <p className="mt-3 text-xs leading-5 text-muted-foreground">
          Manage dashboard access in Wallet and clients in Connect.
        </p>
      ) : null}
    </PolicyManagementSection>
  );
}
