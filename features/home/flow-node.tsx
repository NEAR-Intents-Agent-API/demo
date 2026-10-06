import {
  ArrowDataTransferHorizontalIcon,
  ArrowUp02Icon,
  SentIcon,
  ViewOffSlashIcon,
} from "@hugeicons/core-free-icons";
import { HugeiconsIcon } from "@hugeicons/react";
import { ChainStack } from "@/features/assets";
import { cn } from "@/lib/utils";
import type { FlowDiagramNode } from "./flow-diagram-content";

export function FlowNode({ node }: { node: FlowDiagramNode }) {
  return (
    <article
      className={cn(
        "flex min-w-0 flex-col gap-4 rounded-lg border bg-card p-4",
        node.accent && "border-primary/40",
      )}
    >
      <header className="flex items-center gap-3">
        <span className="flex shrink-0 items-center text-muted-foreground">
          <HugeiconsIcon icon={node.icon} className="size-4" />
        </span>
        <span className="min-w-0">
          <span className="console-eyebrow">
            {node.step} · {node.owner}
          </span>
          <span className="block truncate text-sm font-medium tracking-tight">{node.title}</span>
        </span>
      </header>

      <ul className="flex flex-col gap-1.5 text-xs leading-5 text-muted-foreground">
        {node.lines.map((line) => (
          <li key={line} className="flex items-start gap-1.5">
            <span className="mt-[7px] size-1 shrink-0 rounded-full bg-foreground/30" />
            {line}
          </li>
        ))}
      </ul>

      {node.verbs ? (
        <div className="mt-auto flex flex-wrap gap-x-3 gap-y-1">
          {(
            [
              ["Swap", ArrowDataTransferHorizontalIcon],
              ["Transfer", SentIcon],
              ["Withdraw", ArrowUp02Icon],
              ["Shield", ViewOffSlashIcon],
            ] as const
          ).map(([label, verbIcon]) => (
            <span
              key={label}
              className="inline-flex items-center gap-1 text-[11px] font-medium text-muted-foreground"
            >
              <HugeiconsIcon icon={verbIcon} className="size-3" />
              {label}
            </span>
          ))}
        </div>
      ) : null}

      {node.chains ? (
        <div className="mt-auto">
          <ChainStack
            chains={["near", "eth", "base", "arb", "sol", "btc", "ton", "tron", "sui"]}
            max={7}
            size="sm"
          />
        </div>
      ) : null}
    </article>
  );
}
