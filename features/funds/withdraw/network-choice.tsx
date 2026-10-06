"use client";

import { ChainIcon, ChainPicker, chainInfo } from "@/features/assets";
import type { TokenOption } from "../use-funds";

export function NetworkChoice({
  token,
  network,
  networks,
  onChange,
  disabled,
}: {
  token: TokenOption | null;
  network: string | null;
  networks: readonly string[];
  onChange: (chain: string) => void;
  disabled?: boolean;
}) {
  if (networks.length > 1)
    return (
      <div className="flex flex-col gap-2">
        <span className="console-eyebrow">Send to network</span>
        <ChainPicker
          chains={networks}
          value={network}
          onChange={onChange}
          description="Send to network"
          disabled={disabled}
        />
      </div>
    );
  if (!network)
    return token ? (
      <p className="rounded-lg border border-dashed px-4 py-3 text-sm text-muted-foreground">
        This account may only withdraw to NEAR, and {token.symbol} cannot settle there. Swap it
        first, or allow any network in Rules.
      </p>
    ) : null;
  return (
    <p className="flex items-center gap-2 text-sm text-muted-foreground">
      <ChainIcon chain={network} size="sm" />
      {token?.symbol} can leave to {chainInfo(network).name}.
    </p>
  );
}
