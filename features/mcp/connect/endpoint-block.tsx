"use client";
import { CopyButton } from "@/components/shared/identifiers";

export function EndpointBlock({ endpoint }: { endpoint: string }) {
  return (
    <div className="flex min-w-0 items-start gap-3 rounded-md bg-input/40 px-3 py-2.5">
      <code className="min-w-0 flex-1 break-all font-mono text-xs leading-5 select-text">
        {endpoint}
      </code>
      <CopyButton value={endpoint} label="Copy MCP endpoint" />
    </div>
  );
}
