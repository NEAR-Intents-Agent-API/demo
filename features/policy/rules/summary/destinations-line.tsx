import { AddressChip } from "@/features/assets";
import { destinationName } from "@/features/funds";
import { destinationLabel } from "@/lib/agent-api/schemas";
import type { Rules } from "../rules";

export function DestinationsLine({ rules }: { rules: Rules }) {
  const { mode, list } = rules.destinations;
  if (mode === "any") return <span className="text-sm">Anywhere</span>;
  if (mode === "only" && list.length === 0)
    return <span className="text-sm">Nowhere yet; funds stay in this account</span>;
  return (
    <>
      <span className="text-sm">{mode === "only" ? "Only" : "Anywhere except"}</span>
      {list.map((value) => (
        <AddressChip
          key={`${value.action}:${destinationLabel(value)}`}
          value={destinationName(value)}
        />
      ))}
    </>
  );
}
