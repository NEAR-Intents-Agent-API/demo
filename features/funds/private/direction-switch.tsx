"use client";
import { ViewIcon, ViewOffSlashIcon } from "@hugeicons/core-free-icons";
import { HugeiconsIcon } from "@hugeicons/react";
import { Choice } from "@/components/shared/choice";
import { COPY, type Direction } from "./private-utils";

export function DirectionSwitch({
  value,
  onChange,
}: {
  value: Direction;
  onChange: (next: Direction) => void;
}) {
  return (
    <Choice<Direction>
      label="Direction"
      value={value}
      onChange={onChange}
      className="w-full"
      options={(Object.keys(COPY) as Direction[]).map((id) => ({
        value: id,
        label: (
          <>
            <HugeiconsIcon
              icon={id === "shield" ? ViewOffSlashIcon : ViewIcon}
              className="size-4"
            />
            {COPY[id].label}
          </>
        ),
      }))}
    />
  );
}
