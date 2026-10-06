"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { cn } from "@/lib/utils";

const NAV = [
  { href: "/how-it-works", label: "How it works" },
  { href: "/agents", label: "Agent accounts" },
] as const;

export function SiteHeaderNavigation() {
  const pathname = usePathname();
  return (
    <nav
      className="order-last flex w-full shrink-0 items-stretch gap-2 self-stretch lg:order-none lg:ml-2 lg:w-auto"
      aria-label="Main navigation"
    >
      {NAV.map(({ href, label }) => {
        const active = pathname === href || pathname.startsWith(`${href}/`);
        return (
          <Link
            key={href}
            href={href}
            aria-current={active ? "page" : undefined}
            className={cn(
              "relative flex min-h-10 flex-1 items-center justify-center px-3 text-sm font-medium leading-[22px] whitespace-nowrap transition-colors after:absolute after:inset-x-0 after:-bottom-px after:h-0.5 after:bg-primary after:opacity-0 after:transition-opacity focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-ring lg:flex-none lg:px-4",
              active
                ? "text-primary after:opacity-100"
                : "text-muted-foreground hover:text-foreground",
            )}
          >
            {label}
          </Link>
        );
      })}
    </nav>
  );
}
