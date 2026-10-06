"use client";

import { Switch as SwitchPrimitive } from "@base-ui/react/switch";
import { useId } from "react";
import { cn } from "@/lib/utils";

/** A labelled on/off row. The description states the consequence of turning it on. */
export function Switch({
  checked,
  onChange,
  label,
  description,
  disabled,
  className,
  showState = false,
}: {
  checked: boolean;
  onChange: (checked: boolean) => void;
  label: string;
  description?: string;
  disabled?: boolean;
  className?: string;
  showState?: boolean;
}) {
  const id = useId();
  return (
    <div
      className={cn(
        "flex items-start justify-between gap-4 py-3",
        disabled && "opacity-50",
        className,
      )}
    >
      <label htmlFor={id} className="flex min-w-0 flex-1 cursor-pointer flex-col">
        <span className="text-sm font-medium leading-5">{label}</span>
        {description ? (
          <span className="mt-1 text-xs leading-5 text-muted-foreground">{description}</span>
        ) : null}
      </label>
      <SwitchPrimitive.Root
        id={id}
        checked={checked}
        onCheckedChange={onChange}
        disabled={disabled}
        className={cn(
          "relative mt-0.5 inline-flex shrink-0 items-center rounded-md bg-border transition-colors focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-ring data-checked:bg-primary",
          showState ? "h-8 w-18" : "h-6 w-10",
        )}
      >
        {showState ? (
          <span
            aria-hidden="true"
            className={cn(
              "absolute inset-y-0 flex w-11 items-center justify-center text-xs font-medium",
              checked ? "left-0 text-primary-foreground" : "right-0 text-muted-foreground",
            )}
          >
            {checked ? "On" : "Off"}
          </span>
        ) : null}
        <SwitchPrimitive.Thumb
          className={cn(
            "block rounded-sm bg-background shadow transition-transform",
            showState
              ? "size-6 translate-x-1 data-checked:translate-x-[44px]"
              : "size-5 translate-x-0.5 data-checked:translate-x-[18px]",
          )}
        />
      </SwitchPrimitive.Root>
    </div>
  );
}
