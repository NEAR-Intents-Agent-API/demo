"use client";

import { ArrowDown01Icon } from "@hugeicons/core-free-icons";
import { HugeiconsIcon } from "@hugeicons/react";
import type { ReactNode } from "react";
import { Collapsible, CollapsibleContent, CollapsibleTrigger } from "@/components/ui/collapsible";
import { cn } from "@/lib/utils";

export function GuideDetailRow({
  title,
  asset,
  badge,
  children,
}: {
  title: string;
  asset: string;
  badge?: ReactNode;
  children: ReactNode;
}) {
  return (
    <li>
      <Collapsible className="group/guide">
        <CollapsibleTrigger
          className={cn(
            "group/action grid w-full items-center gap-x-2 py-5 text-left transition-colors hover:text-primary focus-visible:rounded-sm focus-visible:text-primary sm:gap-x-4",
            badge ? "grid-cols-[minmax(0,1fr)_auto_auto]" : "grid-cols-[minmax(0,1fr)_auto]",
          )}
        >
          <span className="flex min-w-0 items-center gap-2 sm:gap-4">
            <span
              className="flex size-6 shrink-0 items-center justify-center text-design-accent transition-colors group-hover/action:text-primary group-focus-visible/action:text-primary"
              aria-hidden="true"
            >
              <span
                className="size-5 bg-current"
                style={{
                  mask: `url("/assets/figma/guide-imgNearIntentsDemoIcon${asset}.svg") center / contain no-repeat`,
                }}
              />
            </span>
            <span className="text-sm leading-6 font-medium sm:text-base">{title}</span>
          </span>
          {badge ? <span className="justify-self-end">{badge}</span> : null}
          <HugeiconsIcon
            icon={ArrowDown01Icon}
            className="size-4 text-muted-foreground transition-[color,transform] group-hover/action:text-primary group-focus-visible/action:text-primary group-data-[panel-open]/guide:rotate-180"
          />
        </CollapsibleTrigger>
        <CollapsibleContent>
          <div className="flex flex-col gap-3 pb-6 text-left">{children}</div>
        </CollapsibleContent>
      </Collapsible>
    </li>
  );
}
