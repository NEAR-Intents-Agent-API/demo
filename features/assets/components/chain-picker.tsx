"use client";
import { ArrowDown01Icon } from "@hugeicons/core-free-icons";
import { HugeiconsIcon } from "@hugeicons/react";
import { ResponsiveDialog } from "@/components/responsive-dialog";
import { Button } from "@/components/ui/button";
import { chainInfo } from "../chains";
import { useNetworkPicker } from "../hooks/use-network-picker";
import { NetworkList } from "./network-list";
import { ChainIcon } from "./token-icon";

export function ChainPicker({
  chains,
  value,
  onChange,
  description = "Choose a network.",
  disabled,
}: {
  chains: readonly string[];
  value: string | null;
  onChange: (chain: string) => void;
  description?: string;
  disabled?: boolean;
}) {
  const picker = useNetworkPicker(chains, onChange);
  return (
    <>
      <Button
        variant="outline"
        disabled={disabled}
        aria-haspopup="dialog"
        aria-expanded={picker.open}
        onClick={() => picker.setOpen(true)}
        className="h-12 w-full justify-start gap-3 border-transparent bg-input/25 px-3 hover:bg-input/35 aria-expanded:bg-input/25"
      >
        {value ? <ChainIcon chain={value} size="md" /> : null}
        <span className="min-w-0 flex-1 truncate text-left">
          {value ? chainInfo(value).name : "Select network"}
        </span>
        <HugeiconsIcon icon={ArrowDown01Icon} className="size-4 text-muted-foreground" />
      </Button>
      <ResponsiveDialog
        open={picker.open}
        onOpenChange={picker.setOpen}
        title="Select network"
        description={description}
        contentClassName="overflow-x-hidden sm:max-w-md"
      >
        <NetworkList
          chains={picker.filtered}
          selected={value}
          query={picker.query}
          onQuery={picker.setQuery}
          onPick={picker.pick}
        />
      </ResponsiveDialog>
    </>
  );
}
