"use client";

import { Download01Icon, Loading03Icon } from "@hugeicons/core-free-icons";
import { HugeiconsIcon } from "@hugeicons/react";
import { useState } from "react";
import { type Connector, useConnect, useConnectors } from "wagmi";
import { ResponsiveDialog } from "@/components/responsive-dialog";
import { useMounted } from "@/components/shared/use-mounted";
import { Button } from "@/components/ui/button";
import { EVM_WALLETS, type EvmWalletBrand, isBrandInstalled } from "@/lib/evm/wallets";

/**
 * The wallet chooser. Every supported brand is always listed with its own icon: installed
 * wallets connect directly (EIP-6963 or their `window.ethereum` flag); anything missing offers
 * its download page instead. No WalletConnect, so nothing leaves the page.
 */
export function EvmWalletPicker({
  open,
  onOpenChange,
  onSelect,
  busyConnectorId,
}: {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  onSelect: (connector: Connector) => void;
  busyConnectorId: string | null;
}) {
  const connectors = useConnectors();
  const { connectAsync } = useConnect();
  const mounted = useMounted();
  const [pendingId, setPendingId] = useState<string | null>(null);
  const [failure, setFailure] = useState<string | null>(null);

  async function choose(brand: EvmWalletBrand) {
    if (pendingId || busyConnectorId) return;
    // An inert legacy target connector exists before the wallet is installed, so installed
    // state decides between connecting and the download page before any connector is used.
    if (!isInstalled(brand, connectors)) {
      window.open(brand.installUrl, "_blank", "noopener,noreferrer");
      return;
    }
    const connector = matchConnector(brand, connectors);
    if (!connector) {
      window.open(brand.installUrl, "_blank", "noopener,noreferrer");
      return;
    }
    setPendingId(brand.id);
    setFailure(null);
    try {
      await connectAsync({ connector });
      setPendingId(null);
      onSelect(connector);
    } catch (cause) {
      // A rejected or failed request leaves the modal open so the owner can pick another.
      setPendingId(null);
      setFailure(cause instanceof Error ? cause.message : "Connection failed. Try again.");
    }
  }

  return (
    <ResponsiveDialog
      open={open}
      onOpenChange={onOpenChange}
      busy={Boolean(pendingId)}
      title="Connect a wallet"
      description="Choose an EVM wallet. Your keys never leave it, and nothing here uses WalletConnect."
    >
      <div className="flex flex-col gap-2">
        {EVM_WALLETS.map((brand) => {
          // Detection reads `window`, so installed-state renders only after hydration.
          const installed = mounted ? isInstalled(brand, connectors) : true;
          const pending = pendingId === brand.id;
          const busy = pending || busyConnectorId === brand.id;
          return (
            <Button
              key={brand.id}
              variant="outline"
              className="h-auto min-h-14 justify-start gap-3 px-3"
              disabled={Boolean(pendingId) || Boolean(busyConnectorId)}
              onClick={() => void choose(brand)}
            >
              {/* biome-ignore lint/performance/noImgElement: vendored brand SVG; next/image adds nothing */}
              <img
                src={brand.icon}
                alt=""
                aria-hidden
                className="size-7 shrink-0 rounded-lg border bg-background object-contain"
              />
              <span className="flex min-w-0 flex-col items-start">
                <span className="font-medium normal-case">{brand.name}</span>
                <span className="text-xs text-muted-foreground normal-case">
                  {installed ? "Connect" : "Not installed"}
                </span>
              </span>
              {busy ? (
                <HugeiconsIcon icon={Loading03Icon} className="ml-auto size-4 animate-spin" />
              ) : installed ? null : (
                <HugeiconsIcon
                  icon={Download01Icon}
                  className="ml-auto size-4 text-muted-foreground"
                />
              )}
            </Button>
          );
        })}
        {failure ? (
          <p role="alert" className="text-sm text-destructive">
            {failure}
          </p>
        ) : null}
      </div>
    </ResponsiveDialog>
  );
}

/**
 * The connector for a brand: its dedicated wagmi connector when it has one, otherwise the
 * EIP-6963 announcement (connector id equals the wallet's rdns), otherwise the explicit
 * legacy target registered in `lib/evm/wallet.ts`.
 */
export function matchConnector(
  brand: EvmWalletBrand,
  connectors: readonly Connector[],
): Connector | undefined {
  if (brand.connectorId) {
    const dedicated = connectors.find((connector) => connector.id === brand.connectorId);
    if (dedicated) return dedicated;
  }
  const announced = connectors.find((connector) => brand.rdns?.includes(connector.id));
  if (announced) return announced;
  return connectors.find((connector) => connector.id === brand.id);
}

/**
 * A wallet is present when it has a dedicated connector (Coinbase and Safe work without an
 * extension: one opens a popup, the other the Safe app), when the browser announces it with
 * EIP-6963, or when its legacy `window.ethereum` flag is set.
 */
function isInstalled(brand: EvmWalletBrand, connectors: readonly Connector[]): boolean {
  if (brand.connectorId && connectors.some((connector) => connector.id === brand.connectorId))
    return true;
  if (connectors.some((connector) => brand.rdns?.includes(connector.id))) return true;
  return isBrandInstalled(brand.id, window);
}
