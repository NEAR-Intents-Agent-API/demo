import { Moon02Icon } from "@hugeicons/core-free-icons";
import { HugeiconsIcon } from "@hugeicons/react";
import Link from "next/link";
import { DesignAsset } from "@/components/shared/design-asset";
import { Button, buttonVariants } from "@/components/ui/button";
import { DemoAccountMenu } from "./demo-account-menu";
import { SiteHeaderNavigation } from "./site-header-navigation";
import type { DemoIdentity } from "./types";

export function SiteHeader({
  identity,
  onSearch,
  onSignOut,
  signingOut = false,
  onToggleTheme,
  dark,
}: {
  identity?: DemoIdentity;
  onSearch?: () => void;
  onSignOut?: () => void;
  signingOut?: boolean;
  onToggleTheme: () => void;
  dark: boolean;
}) {
  return (
    <header
      className="figma-site z-30 shrink-0 border-b bg-background text-foreground"
      data-theme-adaptive
    >
      <div className="mx-auto flex w-full max-w-[1440px] flex-wrap items-center gap-x-3 gap-y-4 px-4 pt-[18px] sm:gap-x-6 md:px-8 lg:min-h-20 lg:flex-nowrap lg:pt-0">
        <Link
          href="/how-it-works"
          className="flex shrink-0 items-center gap-4"
          aria-label="NEAR Intents home"
        >
          <DesignAsset
            name={dark ? "guide-imgGroup1" : "guide-imgGroup1-light"}
            width={152}
            height={19}
            alt="NEAR Intents"
            className="w-[132px] sm:w-[152px]"
          />
          <span className="hidden h-6 border-l sm:block" aria-hidden="true" />
          <span className="site-mono hidden text-[11px] leading-[18px] tracking-[1.2px] text-muted-foreground sm:inline">
            AGENT API
          </span>
        </Link>
        <SiteHeaderNavigation />
        <div className="ml-auto flex shrink-0 items-center gap-2 sm:gap-3">
          {onSearch ? (
            <Button
              variant="outline"
              size="icon"
              onClick={onSearch}
              aria-label="Open search"
              aria-haspopup="dialog"
              aria-keyshortcuts="Meta+K Control+K"
              title="Search pages and accounts (⌘K)"
              className="h-9 w-9 gap-2 rounded-lg border-border bg-card px-0 text-[13px] font-normal text-muted-foreground hover:border-primary/50 hover:bg-primary/10 hover:text-primary sm:w-[180px] sm:justify-start sm:px-3 dark:hover:bg-primary/10"
            >
              <DesignAsset name="guide-imgNearIntentsDemoIconSearch" width={18} height={18} />
              <span className="hidden sm:inline">Search...</span>
              <kbd className="site-mono ml-auto hidden text-[11px] sm:inline">⌘K</kbd>
            </Button>
          ) : null}
          <Button
            variant="ghost"
            size="icon"
            className="size-9"
            onClick={onToggleTheme}
            aria-label="Toggle colour theme"
          >
            {dark ? (
              <DesignAsset name="guide-imgNearIntentsDemoIconSun" width={24} height={24} />
            ) : (
              <HugeiconsIcon icon={Moon02Icon} className="size-6" />
            )}
          </Button>
          {identity && onSignOut ? (
            <DemoAccountMenu
              identity={identity}
              onSignOut={onSignOut}
              signingOut={signingOut}
              siteStyle
            />
          ) : (
            <Link href="/login" className={buttonVariants({ size: "sm" })}>
              Sign in
            </Link>
          )}
        </div>
      </div>
    </header>
  );
}
