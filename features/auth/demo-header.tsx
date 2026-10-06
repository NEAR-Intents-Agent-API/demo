"use client";

import { useTheme } from "next-themes";
import { useMounted } from "@/components/shared/use-mounted";
import { SiteHeader } from "./site-header";
import type { DemoIdentity } from "./types";

export function DemoHeader({
  identity,
  onSearch,
  onSignOut,
  signingOut,
}: {
  identity?: DemoIdentity;
  onSearch?: () => void;
  onSignOut?: () => void;
  signingOut?: boolean;
}) {
  const { resolvedTheme, setTheme } = useTheme();
  const mounted = useMounted();
  return (
    <SiteHeader
      identity={identity}
      onSearch={onSearch}
      onSignOut={onSignOut}
      signingOut={signingOut}
      dark={!mounted || resolvedTheme === "dark"}
      onToggleTheme={() => setTheme(resolvedTheme === "dark" ? "light" : "dark")}
    />
  );
}
