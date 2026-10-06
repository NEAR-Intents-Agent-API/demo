import type { Destination } from "@near-intents-agent-api/sdk";
import { Button } from "@/components/ui/button";
import { destinationLabel } from "@/lib/agent-api/schemas";
import { destinationName } from "./destination-utils";

/** The listed entries of the account's destination rule, each removable before signing. */
export function ApprovedDestinations({
  value,
  onChange,
  mode,
}: {
  value: Destination[];
  mode: "only" | "except";
  onChange: (value: Destination[]) => void;
}) {
  return (
    <section className="flex flex-col gap-2">
      <h3 className="text-sm font-medium">
        {mode === "only" ? "Approved destinations" : "Blocked destinations"} ({value.length})
      </h3>
      {value.length ? (
        <ul className="flex max-h-48 flex-col gap-2 overflow-y-auto">
          {value.map((destination, index) => (
            <li
              key={`${destination.action}:${destinationLabel(destination)}`}
              className="flex items-center justify-between gap-2 rounded-xl border p-2"
            >
              <span className="min-w-0 break-all text-xs">{destinationName(destination)}</span>
              <Button
                type="button"
                variant="ghost"
                size="sm"
                onClick={() => onChange(value.filter((_, position) => position !== index))}
              >
                Remove
              </Button>
            </li>
          ))}
        </ul>
      ) : (
        <p className="text-xs leading-5 text-muted-foreground">
          {mode === "only"
            ? "No destinations approved. Swaps, shield and unshield stay available within this account; withdrawals and transfers are blocked."
            : "Nothing blocked: withdrawals and transfers may go anywhere."}
        </p>
      )}
    </section>
  );
}
