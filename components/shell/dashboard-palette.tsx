"use client";

import {
  ArrowRight01Icon,
  Logout01Icon,
  Moon02Icon,
  PlusSignIcon,
  RefreshIcon,
  Route01Icon,
  Sun03Icon,
  UserGroupIcon,
} from "@hugeicons/core-free-icons";
import { HugeiconsIcon } from "@hugeicons/react";
import type { AgentView } from "@near-intents-agent-api/sdk";
import { useQueryClient } from "@tanstack/react-query";
import { useRouter } from "next/navigation";
import { useTheme } from "next-themes";
import { useState } from "react";
import { ResponsiveDialog } from "@/components/responsive-dialog";
import { shortId } from "@/components/shared/identifiers";
import { useMounted } from "@/components/shared/use-mounted";
import {
  Command,
  CommandEmpty,
  CommandGroup,
  CommandInput,
  CommandItem,
  CommandList,
  CommandSeparator,
  CommandShortcut,
} from "@/components/ui/command";
import { agentRows } from "./palette-items";

const sections = [
  { label: "How it works", path: "/how-it-works", icon: Route01Icon },
  { label: "Agent accounts", path: "/agents", icon: UserGroupIcon },
];

/**
 * Keyboard-first navigation over everything the session can already read: the two pages,
 * this owner's agent accounts and shell actions. The palette holds no
 * credential and calls no new route — it only navigates and invalidates caches.
 */
export function DashboardPalette({
  open,
  onOpenChange,
  agents,
  ownerLabel,
  onSignOut,
  signingOut,
}: {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  agents: AgentView[];
  ownerLabel: string | null;
  onSignOut: () => void;
  signingOut: boolean;
}) {
  const router = useRouter();
  const queryClient = useQueryClient();
  const { resolvedTheme, setTheme } = useTheme();
  const mounted = useMounted();
  const [copyNotice, setCopyNotice] = useState<string | null>(null);

  function goTo(path: string) {
    onOpenChange(false);
    router.push(path);
  }

  return (
    <ResponsiveDialog
      open={open}
      onOpenChange={onOpenChange}
      title="Command palette"
      description="Jump to a section, open an agent account, or act on the workspace."
      hideHeader
      showDrawerCloseButton
      bodyClassName="pt-14"
    >
      <Command>
        <CommandInput placeholder="Search agent accounts, sections…" />
        <CommandList>
          <CommandEmpty>No matches.</CommandEmpty>
          <CommandGroup heading="Navigate">
            {sections.map(({ label, path, icon }) => (
              <CommandItem key={path} value={label} onSelect={() => goTo(path)}>
                <HugeiconsIcon icon={icon} />
                <span>{label}</span>
                <CommandShortcut>
                  <HugeiconsIcon icon={ArrowRight01Icon} className="size-3" />
                </CommandShortcut>
              </CommandItem>
            ))}
          </CommandGroup>
          {agentRows(agents).length > 0 ? (
            <>
              <CommandSeparator />
              <CommandGroup heading={`Agent accounts (${agentRows(agents).length})`}>
                {agentRows(agents).map((row) => (
                  <CommandItem key={row.id} value={row.value} onSelect={() => goTo(row.path)}>
                    <HugeiconsIcon icon={UserGroupIcon} />
                    <span className="truncate">{row.label}</span>
                    <CommandShortcut className="font-mono">{row.detail}</CommandShortcut>
                  </CommandItem>
                ))}
              </CommandGroup>
            </>
          ) : null}
          <CommandSeparator />
          <CommandGroup heading="Actions">
            <CommandItem value="create agent account" onSelect={() => goTo("/agents/new")}>
              <HugeiconsIcon icon={PlusSignIcon} />
              <span>New agent account</span>
            </CommandItem>
            <CommandItem
              value="refresh workspace"
              onSelect={() => {
                onOpenChange(false);
                void queryClient.invalidateQueries();
              }}
            >
              <HugeiconsIcon icon={RefreshIcon} />
              <span>Refresh workspace data</span>
            </CommandItem>
            <CommandItem
              value="toggle theme"
              onSelect={() => {
                setTheme(resolvedTheme === "dark" ? "light" : "dark");
              }}
            >
              <HugeiconsIcon icon={mounted && resolvedTheme === "dark" ? Sun03Icon : Moon02Icon} />
              <span>Toggle theme</span>
              {copyNotice === "theme" ? (
                <CommandShortcut>done</CommandShortcut>
              ) : (
                <CommandShortcut>D</CommandShortcut>
              )}
            </CommandItem>
          </CommandGroup>
          {ownerLabel ? (
            <>
              <CommandSeparator />
              <CommandGroup heading="Session">
                <CommandItem
                  value="copy owner identity"
                  onSelect={async () => {
                    await navigator.clipboard.writeText(ownerLabel);
                    setCopyNotice("owner");
                  }}
                >
                  <HugeiconsIcon icon={UserGroupIcon} />
                  <span className="truncate">Copy owner identity</span>
                  <CommandShortcut className="font-mono">
                    {copyNotice === "owner" ? "copied" : shortId(ownerLabel)}
                  </CommandShortcut>
                </CommandItem>
                <CommandItem value="sign out" disabled={signingOut} onSelect={onSignOut}>
                  <HugeiconsIcon icon={Logout01Icon} />
                  <span>Sign out</span>
                </CommandItem>
              </CommandGroup>
            </>
          ) : null}
        </CommandList>
      </Command>
    </ResponsiveDialog>
  );
}
