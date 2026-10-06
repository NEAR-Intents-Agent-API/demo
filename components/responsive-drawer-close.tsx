import { Cancel01Icon } from "@hugeicons/core-free-icons";
import { HugeiconsIcon } from "@hugeicons/react";
import { Button } from "@/components/ui/button";
import { DrawerClose } from "@/components/ui/drawer";
import { cn } from "@/lib/utils";

export function ResponsiveDrawerClose({
  compactHeader,
  separateHeader,
}: {
  compactHeader: boolean;
  separateHeader: boolean;
}) {
  return (
    <DrawerClose
      render={
        <Button
          variant="ghost"
          size="icon-sm"
          className={cn(
            "absolute z-10 bg-transparent text-muted-foreground hover:bg-transparent hover:text-primary dark:hover:bg-transparent",
            compactHeader ? "right-3 top-3" : "right-4 top-4",
            separateHeader && "top-[74px]",
          )}
        />
      }
    >
      <HugeiconsIcon icon={Cancel01Icon} strokeWidth={1.75} />
      <span className="sr-only">Close</span>
    </DrawerClose>
  );
}
