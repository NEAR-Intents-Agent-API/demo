import type { ComponentProps } from "react";
import { ResponsiveDialog } from "@/components/responsive-dialog";
import { PortfolioDetails } from "./portfolio-details";

export function PortfolioAssetsDialog({
  open,
  onOpenChange,
  ...details
}: ComponentProps<typeof PortfolioDetails> & {
  open: boolean;
  onOpenChange: (open: boolean) => void;
}) {
  return (
    <ResponsiveDialog
      open={open}
      onOpenChange={onOpenChange}
      title="All assets"
      description={`Holdings and account details for your ${details.lane === "public" ? "public" : "private"} balance.`}
      contentClassName="sm:max-w-lg"
      bodyClassName="space-y-4 pt-2"
    >
      <PortfolioDetails {...details} />
    </ResponsiveDialog>
  );
}
