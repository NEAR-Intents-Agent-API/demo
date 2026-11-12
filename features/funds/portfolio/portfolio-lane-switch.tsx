import { Choice } from "@/components/shared/choice";
import type { Lane } from "./portfolio";

export function PortfolioLaneSwitch({
  lane,
  onLane,
  disabled,
  className,
}: {
  lane: Lane;
  onLane: (lane: Lane) => void;
  disabled: boolean;
  className?: string;
}) {
  return (
    <Choice<Lane>
      label="Balance"
      value={lane}
      onChange={onLane}
      disabled={disabled}
      className={className}
      options={[
        { value: "confidential", label: "Confidential" },
        { value: "public", label: "Legacy public" },
      ]}
    />
  );
}
