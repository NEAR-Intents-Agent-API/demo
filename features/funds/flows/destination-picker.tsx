"use client";

import { CheckmarkCircle02Icon } from "@hugeicons/core-free-icons";
import { HugeiconsIcon } from "@hugeicons/react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { cn } from "@/lib/utils";

/** Account rules choose approved entries or allow typed destinations. */
export function DestinationPicker({
  label,
  destinations,
  value,
  onChange,
  onManage,
  empty,
  emptyTitle,
  actionLabel,
  embedded = false,
  open = false,
}: {
  label: string;
  destinations: readonly string[];
  value: string | null;
  onChange: (destination: string) => void;
  onManage: () => void;
  empty: string;
  emptyTitle: string;
  actionLabel: string;
  embedded?: boolean;
  open?: boolean;
}) {
  return (
    <fieldset
      className={cn(
        "@container min-w-0 p-4",
        embedded
          ? "border-t border-border/50"
          : "rounded-lg border border-transparent bg-input/25 transition-colors",
      )}
    >
      <legend className="sr-only">{label}</legend>
      <div className="mb-2 flex items-center justify-between gap-2">
        <span className="console-eyebrow" aria-hidden="true">
          {label}
        </span>
        {destinations.length > 0 || open ? (
          <Button type="button" variant="ghost" size="xs" onClick={onManage}>
            {open ? "Destination rule" : "Manage"}
          </Button>
        ) : null}
      </div>
      {open ? (
        <div className="space-y-3">
          <Input
            aria-label={label}
            value={value ?? ""}
            onChange={(event) => onChange(event.target.value.trim())}
            spellCheck={false}
            autoCapitalize="none"
            autoComplete="off"
            maxLength={256}
            placeholder="Paste the recipient's address"
          />
          <p className="text-xs leading-5 text-muted-foreground">
            Account destination rule allows this unless destination is blocked.
          </p>
        </div>
      ) : destinations.length === 0 ? (
        <>
          <div className="flex flex-col items-start gap-3 @xs:flex-row @xs:items-center">
            <p className="min-w-0 flex-1 text-sm text-muted-foreground">{emptyTitle}</p>
            <Button
              type="button"
              variant="outline"
              onClick={onManage}
              className="focus-visible:border-primary focus-visible:ring-0 h-11 border-transparent bg-input/25 px-4 hover:bg-input/35"
            >
              {actionLabel}
            </Button>
          </div>
          <p className="mt-3 text-xs leading-5 text-muted-foreground">{empty}</p>
        </>
      ) : (
        <ul className="flex flex-col gap-1.5">
          {destinations.map((destination) => (
            <li key={destination}>
              <Button
                type="button"
                variant="outline"
                aria-pressed={value === destination}
                onClick={() => onChange(destination)}
                className={cn(
                  "focus-visible:border-primary focus-visible:ring-0 h-auto min-h-11 w-full justify-between gap-3 border-transparent bg-input/25 px-3 py-2.5 text-left whitespace-normal hover:bg-input/35",
                  value === destination && "border-primary/40 bg-primary/10 hover:bg-primary/15",
                )}
              >
                <span className="console-id min-w-0 flex-1 break-all">{destination}</span>
                <span className="size-4 shrink-0">
                  {value === destination ? (
                    <HugeiconsIcon
                      icon={CheckmarkCircle02Icon}
                      className="size-4 text-primary"
                      aria-hidden="true"
                    />
                  ) : null}
                </span>
              </Button>
            </li>
          ))}
        </ul>
      )}
    </fieldset>
  );
}
