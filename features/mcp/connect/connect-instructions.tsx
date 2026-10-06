import { Button } from "@/components/ui/button";
import { EndpointBlock } from "./endpoint-block";

export function ConnectInstructions({
  endpoint,
  onApiKey,
}: {
  endpoint: string;
  onApiKey: () => void;
}) {
  return (
    <div className="space-y-4">
      <ol className="space-y-4">
        <li className="min-w-0 space-y-2">
          <div className="flex items-center gap-2">
            <span
              className="flex size-5 shrink-0 items-center justify-center rounded-full border text-[11px] text-muted-foreground"
              aria-hidden="true"
            >
              1
            </span>
            <h3 className="text-sm font-medium">Add endpoint</h3>
          </div>
          <p className="text-xs leading-5 text-muted-foreground">
            Paste into your client's MCP server settings.
          </p>
          <EndpointBlock endpoint={endpoint} />
        </li>
        <li className="space-y-2">
          <div className="flex items-center gap-2">
            <span
              className="flex size-5 shrink-0 items-center justify-center rounded-full border text-[11px] text-muted-foreground"
              aria-hidden="true"
            >
              2
            </span>
            <h3 className="text-sm font-medium">Approve access</h3>
          </div>
          <p className="text-xs leading-5 text-muted-foreground">
            Sign in to identify yourself. Review account rules, then sign your client’s spending
            grant. Signing in alone does not authorize spending.
          </p>
        </li>
      </ol>
      <div className="flex flex-wrap items-center justify-between gap-3 border-t pt-4">
        <div className="min-w-0">
          <p className="text-xs font-medium">Using a Bearer token?</p>
          <p className="mt-1 text-xs text-muted-foreground">
            Sign a separate client grant, then create its key. All clients share account rules and
            spending budget.
          </p>
        </div>
        <Button variant="outline" size="sm" onClick={onApiKey}>
          Authorize client and create API key
        </Button>
      </div>
    </div>
  );
}
