"use client";

import type { ReactNode } from "react";
import { Button } from "@/components/ui/button";
import { cn } from "@/lib/utils";

/** One grouped control for mutually exclusive modes; selected mode stays visible. */
export function Choice<T extends string | number>({
  value,
  onChange,
  options,
  label,
  disabled,
  className,
}: {
  value: T;
  onChange: (value: T) => void;
  options: readonly { value: T; label: ReactNode }[];
  label: string;
  disabled?: boolean;
  className?: string;
}) {
  return (
    <fieldset
      disabled={disabled}
      className={cn(
        "inline-grid auto-cols-fr grid-flow-col gap-0.5 self-start rounded-md border border-input/60 bg-muted p-1.5",
        className,
      )}
    >
      <legend className="sr-only">{label}</legend>
      {options.map((option) => (
        <Button
          key={option.value}
          type="button"
          variant="ghost"
          size="sm"
          disabled={disabled}
          aria-pressed={value === option.value}
          onClick={() => onChange(option.value)}
          className={cn(
            "h-9 px-4 text-xs",
            value === option.value
              ? "bg-primary text-primary-foreground hover:bg-primary dark:hover:bg-primary"
              : "text-muted-foreground hover:bg-transparent hover:text-foreground",
          )}
        >
          {option.label}
        </Button>
      ))}
    </fieldset>
  );
}
