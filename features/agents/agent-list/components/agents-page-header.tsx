import { PlusSignIcon, RefreshIcon } from "@hugeicons/core-free-icons";
import { HugeiconsIcon } from "@hugeicons/react";
import Link from "next/link";
import { Button, buttonVariants } from "@/components/ui/button";
import { cn } from "@/lib/utils";

export function AgentsPageHeader({
  refreshing,
  onRefresh,
}: {
  refreshing: boolean;
  onRefresh: () => void;
}) {
  return (
    <header className="flex flex-col items-start gap-6 lg:flex-row lg:justify-between">
      <div className="flex min-w-0 flex-col items-start gap-5">
        <h1 className="text-[30px] leading-[1.25] font-bold tracking-[-1.1px] sm:text-[38px] sm:leading-[48px]">
          Agent <span className="text-primary">accounts</span>
        </h1>
        <span className="h-px w-24 bg-primary" aria-hidden="true" />
        <p className="max-w-2xl text-[17px] leading-7 text-muted-foreground">
          Manage wallets, rules and connected clients. Each account has its own balance and spending
          limits.
        </p>
      </div>
      <div className="flex shrink-0 flex-wrap items-center gap-3 lg:pt-1">
        <Button
          variant="ghost"
          className="h-11 rounded-[8px] text-muted-foreground"
          aria-label="Refresh accounts"
          onClick={onRefresh}
          disabled={refreshing}
        >
          <HugeiconsIcon
            icon={RefreshIcon}
            className={cn("size-4", refreshing && "animate-spin")}
          />
          Refresh
        </Button>
        <Link
          href="/agents/new"
          className={cn(
            buttonVariants({ variant: "outline" }),
            "site-mono h-11 rounded-[8px] border-primary bg-background px-5 text-[13px] leading-[22px] font-normal tracking-[1.4px] text-primary hover:bg-primary/10 hover:text-primary",
          )}
        >
          <HugeiconsIcon icon={PlusSignIcon} className="size-4" aria-hidden="true" />
          New Account
        </Link>
      </div>
    </header>
  );
}
