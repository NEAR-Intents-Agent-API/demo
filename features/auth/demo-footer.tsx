import Link from "next/link";
import { DesignAsset } from "@/components/shared/design-asset";
import { cn } from "@/lib/utils";

export function DemoFooter({ className }: { className?: string }) {
  return (
    <footer className={cn("mt-14 border-t border-border py-6", className)}>
      <div className="flex flex-col gap-6 lg:flex-row lg:items-center lg:justify-between lg:gap-12">
        <div className="flex shrink-0 flex-col items-start gap-2">
          <Link href="/how-it-works" aria-label="NEAR Intents home">
            <DesignAsset
              name="guide-imgGroup1-light"
              width={128}
              height={16}
              className="dark:hidden"
            />
            <DesignAsset
              name="guide-imgGroup1"
              width={128}
              height={16}
              className="hidden dark:block"
            />
          </Link>
          <span className="site-mono text-[10px] tracking-widest text-muted-foreground">
            AGENT API
          </span>
        </div>
        <div className="grid w-full gap-5 sm:grid-cols-2 sm:gap-8 lg:max-w-2xl">
          <div className="min-w-0 space-y-1.5">
            <p className="text-xs font-medium text-foreground capitalize">
              API key stays server-side
            </p>
            <p className="text-xs leading-5 text-muted-foreground">
              Partner API keys never reach your browser.
            </p>
          </div>
          <div className="min-w-0 space-y-1.5 sm:border-l sm:pl-8">
            <p className="text-xs font-medium text-foreground capitalize">
              Your signed rules stay in control
            </p>
            <p className="text-xs leading-5 text-muted-foreground">
              Approvals cannot raise your limits.
            </p>
          </div>
        </div>
      </div>
    </footer>
  );
}
