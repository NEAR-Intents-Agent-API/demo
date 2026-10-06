import { PlusSignIcon } from "@hugeicons/core-free-icons";
import { HugeiconsIcon } from "@hugeicons/react";
import { Button } from "@/components/ui/button";

export function RulesAddButton({ label, onClick }: { label: string; onClick: () => void }) {
  return (
    <Button
      type="button"
      variant="outline"
      size="sm"
      onClick={onClick}
      className="bg-transparent text-xs text-muted-foreground hover:bg-transparent"
    >
      <HugeiconsIcon icon={PlusSignIcon} className="size-3.5" />
      {label}
    </Button>
  );
}
