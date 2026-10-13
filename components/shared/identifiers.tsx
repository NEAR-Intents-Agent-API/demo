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

/** Long enough that a phone-width row may clip it, so it needs a way to show everything. */
const CLIPPABLE_LENGTH = 20;

/**
 * An identifier with a copy affordance. A shortened or long value is a button: tapping it
 * reveals the full value in place, which is the only way to read it on a touch screen where
 * the hover tooltip never appears.
 */
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
  const [expanded, setExpanded] = useState(false);
  const shown = head === undefined && tail === undefined ? value : shortId(value, head, tail);
  const expandable = shown !== value || value.length > CLIPPABLE_LENGTH;
  const text = expanded ? value : shown;
  return (
    <span className={cn("inline-flex min-w-0 items-center gap-1", className)}>
      {expandable ? (
        <button
          type="button"
          className={cn(
            "console-id min-w-0 cursor-pointer text-left text-muted-foreground",
            expanded ? "break-all" : "truncate",
          )}
          aria-expanded={expanded}
          aria-label={expanded ? `${value} (tap to shorten)` : `${value} (tap to show in full)`}
          title={value}
          onClick={() => setExpanded((open) => !open)}
        >
          {text}
        </button>
      ) : (
        <span className="console-id truncate text-muted-foreground" title={value}>
          {shown}
        </span>
      )}
      {copyable ? <CopyButton value={value} label={label ?? `Copy ${value}`} /> : null}
    </span>
  );
}
