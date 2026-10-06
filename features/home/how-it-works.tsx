import Link from "next/link";
import { buttonVariants } from "@/components/ui/button";
import { cn } from "@/lib/utils";
import { FlowDiagram } from "./flow-diagram";
import { KeyRoles } from "./key-roles";
import { MoneyMoves } from "./money-moves";
import { NetworkStrip } from "./network-strip";

export function HowItWorks() {
  return (
    <div className="flex flex-col gap-14">
      <header className="flex flex-col items-start gap-5">
        <h1 className="text-[30px] leading-[1.25] font-bold tracking-[-1.1px] sm:text-[38px] sm:leading-[48px]">
          Give your AI agent a wallet. <span className="text-primary">You set the rules.</span>
        </h1>
        <span className="h-px w-24 bg-primary" aria-hidden="true" />
        <p className="text-[17px] leading-7 text-muted-foreground">
          Each agent account has a custody wallet on NEAR Intents. Set spending limits, allowed
          tokens, and approved destinations. Connected agents can only act within those rules.
        </p>
        <Link
          href="/agents"
          className={cn(
            buttonVariants({ variant: "outline" }),
            "site-mono h-11 rounded-[8px] border-primary bg-background px-5 text-[13px] leading-[22px] font-normal tracking-[1.4px] text-primary hover:bg-primary/10 hover:text-primary",
          )}
        >
          + Open Agent Accounts
        </Link>
      </header>
      <section aria-labelledby="flow-title" className="flex flex-col gap-6">
        <h2 id="flow-title" className="text-[22px] leading-7 font-bold tracking-[-0.35px]">
          How It Works
        </h2>
        <FlowDiagram siteStyle />
      </section>
      <div className="grid w-full gap-10 lg:grid-cols-2 lg:gap-0">
        <MoneyMoves />
        <KeyRoles />
      </div>
      <section aria-labelledby="networks-title" className="flex flex-col gap-6">
        <h2 id="networks-title" className="text-[22px] leading-7 font-bold tracking-[-0.35px]">
          Supported Networks
        </h2>
        <NetworkStrip />
      </section>
    </div>
  );
}
