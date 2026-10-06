"use client";

import { useCallback, useRef, useState } from "react";
import type { Connector } from "wagmi";
import { authClient } from "@/lib/auth/client";
import { connectedEvmRequest } from "@/lib/evm/wallet";
import { authFailureMessage } from "./errors";
import { continuePendingAuthorization } from "./oauth-continue";
import { evmLogin, nearLogin, passkeyLogin, passkeyRegister } from "./providers";
import type { AuthAction } from "./types";

export function useLogin(returnTo: string) {
  const running = useRef(false);
  const [busy, setBusy] = useState<AuthAction | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [walletPickerOpen, setWalletPickerOpen] = useState(false);
  const [busyConnectorId, setBusyConnectorId] = useState<string | null>(null);

  const run = useCallback(
    async (action: AuthAction, task: () => Promise<void>) => {
      if (running.current) return;
      running.current = true;
      setBusy(action);
      setError(null);
      try {
        await task();
        // The plugin's own store is the source of truth; a session that did not survive the
        // round trip is a failure, not a successful sign-in.
        const { data: session } = await authClient.getSession();
        if (!session) throw new Error("auth_session_missing");
        if (continuePendingAuthorization()) return;
        // Retire cached unauthenticated routes together with this document.
        window.location.replace(returnTo);
      } catch (cause) {
        setError(authFailureMessage(cause));
        running.current = false;
        setBusy(null);
        setBusyConnectorId(null);
      }
    },
    [returnTo],
  );

  function selectProvider(action: AuthAction) {
    if (action === "evm") {
      setWalletPickerOpen(true);
      return;
    }
    const task =
      action === "near"
        ? nearLogin
        : action === "passkey"
          ? passkeyLogin
          : () => passkeyRegister("Owner passkey");
    void run(action, task);
  }

  /**
   * The picker already connected the wallet; the modal closes before the SIWE signature so a
   * rejection lands back on the panel where the error is visible.
   */
  function selectEvmConnector(connector: Connector) {
    setWalletPickerOpen(false);
    setBusyConnectorId(connector.id);
    void run("evm", async () => {
      const accounts = await connector.getAccounts();
      const address = accounts[0] ?? "";
      await evmLogin(address, await connectedEvmRequest(address));
      setBusyConnectorId(null);
    });
  }

  return {
    busy,
    error,
    walletPickerOpen,
    setWalletPickerOpen,
    busyConnectorId,
    selectProvider,
    selectEvmConnector,
  };
}
