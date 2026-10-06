"use client";
import { PlusSignIcon } from "@hugeicons/core-free-icons";
import { HugeiconsIcon } from "@hugeicons/react";
import Link from "next/link";
import { buttonVariants } from "@/components/ui/button";
import { FlowDiagram } from "@/features/home/index";
import { cn } from "@/lib/utils";

export function Welcome() {
  return (
    <div className="flex flex-col gap-14">
      <div className="flex flex-col items-start gap-5 rounded-[16px] border bg-card p-5 sm:p-6">
        <h2 className="max-w-xl text-[22px] leading-7 font-bold tracking-[-0.35px]">
          Create your first agent wallet
        </h2>
        <p className="max-w-xl text-sm leading-[23px] text-muted-foreground">
          Name it, choose its limits and sign once. That signature makes you its owner and installs
          its rules. Then fund it, and let it swap, send and withdraw across networks — inside those
          rules.
        </p>
        <div className="flex flex-wrap gap-2">
          <Link
            href="/agents/new"
            className={cn(
              buttonVariants({ variant: "outline" }),
              "site-mono h-11 rounded-[8px] border-primary bg-background px-5 text-[13px] font-normal tracking-[1.4px] text-primary hover:bg-primary/10 hover:text-primary",
            )}
          >
            <HugeiconsIcon icon={PlusSignIcon} className="size-4" />
            Create your first agent account
          </Link>
          <Link href="/how-it-works" className={buttonVariants({ variant: "link", size: "lg" })}>
            See how it works
          </Link>
        </div>
      </div>
      <section className="flex flex-col gap-6" aria-labelledby="welcome-flow-title">
        <h2 id="welcome-flow-title" className="text-[22px] leading-7 font-bold tracking-[-0.35px]">
          The big picture
        </h2>
        <FlowDiagram siteStyle />
      </section>
    </div>
  );
}
