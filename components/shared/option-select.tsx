"use client";

import { ArrowDown01Icon } from "@hugeicons/core-free-icons";
import { HugeiconsIcon } from "@hugeicons/react";
import { ResponsiveDialog } from "@/components/responsive-dialog";
import { Button } from "@/components/ui/button";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuRadioGroup,
  DropdownMenuRadioItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { cn } from "@/lib/utils";
import { useOptionSelect } from "./use-option-select";

export function OptionSelect<T extends string>({
  label,
  description,
  value,
  onChange,
  options,
  disabled = false,
  open,
  onOpenChange,
  className,
}: {
  label: string;
  description?: string;
  value: T;
  onChange: (value: T) => void;
  options: readonly { value: T; label: string }[];
  disabled?: boolean;
  open?: boolean;
  onOpenChange?: (open: boolean) => void;
  className?: string;
}) {
  const picker = useOptionSelect({ options, onChange, disabled, open, onOpenChange });
  const trigger = (
    <Button
      type="button"
      variant="outline"
      disabled={disabled}
      aria-labelledby={`${picker.labelId} ${picker.labelId}-value`}
      aria-haspopup={picker.mobile ? "dialog" : "menu"}
      aria-expanded={picker.open}
      onClick={picker.mobile ? () => picker.setOpen(true) : undefined}
      className="h-9 w-full justify-between border-transparent bg-input/50 font-normal hover:bg-input/50 aria-expanded:bg-input/50 focus-visible:border-primary focus-visible:ring-0"
    >
      <span id={`${picker.labelId}-value`} className="truncate">
        {options.find((option) => option.value === value)?.label}
      </span>
      <HugeiconsIcon icon={ArrowDown01Icon} className="size-4 text-muted-foreground" />
    </Button>
  );
  return (
    <div className={cn("min-w-0 space-y-2", className)}>
      <span id={picker.labelId} className="block text-xs leading-5 font-medium">
        {label}
      </span>
      {picker.mobile ? (
        <>
          {trigger}
          <ResponsiveDialog
            open={picker.open}
            onOpenChange={picker.setOpen}
            title={label}
            description={description ?? `Choose ${label.toLowerCase()}.`}
          >
            <div className="flex flex-col gap-1">
              {options.map((option) => (
                <Button
                  key={option.value}
                  type="button"
                  variant="ghost"
                  disabled={disabled}
                  aria-pressed={value === option.value}
                  onClick={() => picker.pick(option.value)}
                  className="h-12 justify-start px-3 hover:bg-transparent hover:underline aria-pressed:bg-transparent"
                >
                  {option.label}
                </Button>
              ))}
            </div>
          </ResponsiveDialog>
        </>
      ) : (
        <DropdownMenu open={picker.open} onOpenChange={picker.setOpen}>
          <DropdownMenuTrigger render={trigger} />
          <DropdownMenuContent>
            <DropdownMenuRadioGroup value={value} onValueChange={picker.pick}>
              {options.map((option) => (
                <DropdownMenuRadioItem key={option.value} value={option.value}>
                  {option.label}
                </DropdownMenuRadioItem>
              ))}
            </DropdownMenuRadioGroup>
          </DropdownMenuContent>
        </DropdownMenu>
      )}
    </div>
  );
}
