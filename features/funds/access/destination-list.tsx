import type { Destination } from "@near-intents-agent-api/sdk";
import { Button } from "@/components/ui/button";
import { chainInfo } from "@/features/assets";
import { destinationLabel } from "@/lib/agent-api/schemas";
import { destinationActionLabel } from "./destination-display";

export function DestinationList({
  destinations,
  onRemove,
  disabled = false,
  mode,
}: {
  destinations: readonly Destination[];
  onRemove: (index: number) => void;
  disabled?: boolean;
  mode: "only" | "except";
}) {
  return (
    <div className="space-y-3">
      <div className="flex items-center justify-between gap-3">
        <h3 className="text-sm font-medium">
          {mode === "only" ? "Approved" : "Blocked"} destinations
        </h3>
        <span className="text-xs text-muted-foreground tabular-nums">{destinations.length}</span>
      </div>
      {destinations.length ? (
        <ul className="divide-y">
          {destinations.map((item, index) => (
            <li
              key={`${item.action}:${destinationLabel(item)}`}
              className="flex items-start gap-3 py-3"
            >
              <div className="min-w-0 flex-1 space-y-1">
                <p className="text-xs font-medium">
                  {destinationActionLabel(item)}
                  <span className="font-normal text-muted-foreground">
                    {" "}
                    · {item.action === "withdraw" ? chainInfo(item.chain).name : "NEAR Intents"}
                  </span>
                </p>
                <p className="console-id break-all text-muted-foreground">{item.address}</p>
                {item.action === "withdraw" && item.memo !== null ? (
                  <p className="text-xs text-muted-foreground">
                    Memo: <span className="break-all">{item.memo}</span>
                  </p>
                ) : null}
              </div>
              <Button
                type="button"
                variant="ghost"
                size="xs"
                disabled={disabled}
                onClick={() => onRemove(index)}
              >
                Remove
              </Button>
            </li>
          ))}
        </ul>
      ) : (
        <p className="text-xs leading-5 text-muted-foreground">
          {mode === "only"
            ? "No destinations approved. Swaps, shield and unshield stay available; withdrawals and transfers are blocked."
            : "Nothing blocked: withdrawals and transfers may go anywhere."}
        </p>
      )}
    </div>
  );
}
