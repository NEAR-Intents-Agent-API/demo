import type { ReactNode } from "react";

export function RulesOverviewRow({ label, children }: { label: string; children: ReactNode }) {
  return (
    <div className="grid gap-2 py-4 sm:grid-cols-[9rem_minmax(0,1fr)] sm:items-start sm:gap-4">
      <dt className="text-xs leading-6 text-muted-foreground">{label}</dt>
      <dd className="min-w-0 text-sm font-medium leading-6">{children}</dd>
    </div>
  );
}
