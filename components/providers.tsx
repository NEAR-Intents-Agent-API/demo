"use client";

import { QueryClientProvider } from "@tanstack/react-query";
import { useEffect, useState } from "react";
import { WagmiProvider } from "wagmi";
import { SessionBoundary } from "@/components/session-boundary";
import { evmConfig } from "@/lib/evm/wallet";
import { createDemoQueryClient } from "@/lib/query/client";

export function Providers({
  children,
  userId,
}: {
  children: React.ReactNode;
  userId: string | null;
}) {
  const [client] = useState(createDemoQueryClient);
  useEffect(
    () => () => {
      void client.cancelQueries();
      client.clear();
    },
    [client],
  );
  return (
    <WagmiProvider config={evmConfig} reconnectOnMount>
      <QueryClientProvider client={client}>
        <SessionBoundary userId={userId}>{children}</SessionBoundary>
      </QueryClientProvider>
    </WagmiProvider>
  );
}
