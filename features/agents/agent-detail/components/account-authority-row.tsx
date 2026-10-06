import type { ReactNode } from "react";
import { StatusPill } from "@/components/shared/status";

export function AccountAuthorityRow({
  label,
  description,
  ready,
  status,
  children,
}: {
  label: string;
  description: string;
  ready: boolean;
  status: string;
  children: ReactNode;
}) {
  return (
    <div className="min-w-0 space-y-1.5 py-3 first:pt-0 last:pb-0">
      <div className="flex items-center justify-between gap-3">
        <dt className="text-sm font-medium">{label}</dt>
        <StatusPill tone={ready ? "ok" : "neutral"}>{status}</StatusPill>
      </div>
      <dd className="flex min-w-0 flex-wrap items-center gap-x-2 gap-y-1 text-xs">{children}</dd>
      <dd className="text-xs leading-5 text-muted-foreground">{description}</dd>
    </div>
  );
}
