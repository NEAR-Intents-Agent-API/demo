"use client";

import { ArrowDown01Icon } from "@hugeicons/core-free-icons";
import { HugeiconsIcon } from "@hugeicons/react";
import { Collapsible, CollapsibleContent, CollapsibleTrigger } from "@/components/ui/collapsible";
import { cn } from "@/lib/utils";

/**
 * Progressive disclosure for detail that answers "can I verify this?" rather than
 * "what do I do now?". The summary is a question a visitor might ask; the panel is evidence.
 */
export function Disclosure({
  summary,
  children,
  className,
  defaultOpen = false,
}: {
  summary: React.ReactNode;
  children: React.ReactNode;
  className?: string;
  defaultOpen?: boolean;
}) {
  return (
    <Collapsible defaultOpen={defaultOpen} className={cn("group/disclosure", className)}>
      <CollapsibleTrigger className="flex w-full items-center gap-1.5 text-left text-xs text-muted-foreground transition-colors hover:text-foreground">
        <HugeiconsIcon
          icon={ArrowDown01Icon}
          className="size-3.5 shrink-0 transition-transform group-data-[panel-open]/disclosure:rotate-180"
        />
        {summary}
      </CollapsibleTrigger>
      <CollapsibleContent>{children}</CollapsibleContent>
    </Collapsible>
  );
}
