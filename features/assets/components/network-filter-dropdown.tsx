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
import { useIsMobile } from "@/hooks/use-mobile";
import { chainInfo } from "../chains";
import { usePickerDialog } from "../hooks/use-picker-dialog";
import { NetworkFilterOptions } from "./network-filter-options";
import { ChainIcon } from "./token-icon";

export function NetworkFilterDropdown({
  chains,
  value,
  onChange,
}: {
  chains: readonly string[];
  value: string | null;
  onChange: (chain: string | null) => void;
}) {
  const mobile = useIsMobile();
  const picker = usePickerDialog(onChange);
  const trigger = (
    <Button
      variant="outline"
      aria-label={`Network: ${value ? chainInfo(value).name : "All networks"}`}
      aria-haspopup={mobile ? "dialog" : "menu"}
      aria-expanded={picker.open}
      onClick={mobile ? () => picker.setOpen(true) : undefined}
      className="h-16 w-full justify-start gap-3 rounded-lg border-transparent bg-input/25 px-3 hover:bg-input/35 aria-expanded:bg-input/25"
    >
      {value ? <ChainIcon chain={value} size="md" /> : null}
      <span className="flex min-w-0 flex-1 flex-col text-left">
        <span className="text-xs font-normal text-muted-foreground">Network</span>
        <span className="truncate text-sm font-medium">
          {value ? chainInfo(value).name : "All networks"}
        </span>
      </span>
      <HugeiconsIcon icon={ArrowDown01Icon} className="size-4 text-muted-foreground" />
    </Button>
  );

  return mobile ? (
    <>
      {trigger}
      <ResponsiveDialog
        open={picker.open}
        onOpenChange={picker.setOpen}
        title="Select network"
        description="Search tokens and filter by network."
      >
        <NetworkFilterOptions chains={chains} value={value} onPick={picker.pick} />
      </ResponsiveDialog>
    </>
  ) : (
    <DropdownMenu open={picker.open} onOpenChange={picker.setOpen}>
      <DropdownMenuTrigger render={trigger} />
      <DropdownMenuContent className="max-h-[min(20rem,var(--available-height))]">
        <DropdownMenuRadioGroup
          value={value ?? ""}
          onValueChange={(next) => {
            if (next === "" || chains.includes(next)) picker.pick(next || null);
          }}
        >
          <DropdownMenuRadioItem value="" className="h-12 data-checked:text-primary">
            All networks
          </DropdownMenuRadioItem>
          {chains.map((id) => (
            <DropdownMenuRadioItem key={id} value={id} className="h-12 data-checked:text-primary">
              <ChainIcon chain={id} size="md" />
              <span className="truncate">{chainInfo(id).name}</span>
            </DropdownMenuRadioItem>
          ))}
        </DropdownMenuRadioGroup>
      </DropdownMenuContent>
    </DropdownMenu>
  );
}
