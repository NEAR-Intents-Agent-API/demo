import { HugeiconsIcon } from "@hugeicons/react";
import type { ReactNode } from "react";

export function SummaryField({
  icon,
  label,
  children,
}: {
  icon: Parameters<typeof HugeiconsIcon>[0]["icon"];
  label: string;
  children: ReactNode;
}) {
  return (
    <div className="flex min-w-0 flex-col gap-2 border-b py-3">
      <dt className="flex items-center gap-2 text-xs text-muted-foreground">
        <HugeiconsIcon icon={icon} className="size-4" />
        {label}
      </dt>
      <dd className="flex min-w-0 flex-wrap items-center gap-2 text-sm leading-6">{children}</dd>
    </div>
  );
}
