"use client";

import { CheckmarkCircle02Icon, Copy01Icon } from "@hugeicons/core-free-icons";
import { HugeiconsIcon } from "@hugeicons/react";
import { useState } from "react";
import { Button } from "@/components/ui/button";
import { cn } from "@/lib/utils";

/**
 * Identifiers in the demo are long by nature — 64-character agent ids, transaction hashes,
 * account ids. Two rules keep them readable: elide the middle so both ends stay verifiable,
 * and always offer a copy, because nobody retypes a hash.
 */

export function shortId(value: string, head = 10, tail = 6): string {
  if (value.length <= head + tail + 3) return value;
  return `${value.slice(0, head)}…${value.slice(-tail)}`;
}

export function CopyButton({
  value,
  label = "Copy",
  className,
}: {
  value: string;
  label?: string;
  className?: string;
}) {
  const [copied, setCopied] = useState(false);

  async function copy() {
    try {
      await navigator.clipboard.writeText(value);
      setCopied(true);
      window.setTimeout(() => setCopied(false), 1600);
    } catch {
      // Clipboard is unavailable (insecure origin). The value is still selectable on screen.
    }
  }

  return (
    <Button
      type="button"
      variant="ghost"
      size="icon-xs"
      className={cn("shrink-0 text-muted-foreground hover:text-foreground", className)}
      aria-label={label}
      onClick={() => void copy()}
    >
      <HugeiconsIcon icon={copied ? CheckmarkCircle02Icon : Copy01Icon} />
    </Button>
  );
}

/** An identifier with its full value in the tooltip and a copy affordance. */
export function MonoId({
  value,
  className,
  head,
  tail,
  copyable = true,
  label,
}: {
  value: string;
  className?: string;
  head?: number;
  tail?: number;
  copyable?: boolean;
  label?: string;
}) {
  const shown = head === undefined && tail === undefined ? value : shortId(value, head, tail);
  return (
    <span className={cn("inline-flex min-w-0 items-center gap-1", className)}>
      <span className="console-id truncate text-muted-foreground" title={value}>
        {shown}
      </span>
      {copyable ? <CopyButton value={value} label={label ?? `Copy ${value}`} /> : null}
    </span>
  );
}
