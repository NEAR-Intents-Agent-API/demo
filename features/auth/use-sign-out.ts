"use client";

import { useQueryClient } from "@tanstack/react-query";
import { useRef, useState } from "react";
import { authClient } from "@/lib/auth/client";
import { disconnectNearWallet } from "@/lib/near/wallet";

/**
 * Both the account menu and the command palette share this sign-out lifecycle. The plugin
 * deletes the server session row and clears the cookie; the retained NEAR wallet selection is
 * dropped too, so the next visitor to this browser starts from the picker.
 */
export function useSignOut() {
  const cache = useQueryClient();
  const running = useRef(false);
  const [pending, setPending] = useState(false);
  const [error, setError] = useState<string | null>(null);

  async function signOut() {
    if (running.current) return;
    running.current = true;
    setPending(true);
    setError(null);
    const { error: signOutError } = await authClient.signOut();
    if (signOutError) {
      running.current = false;
      setPending(false);
      setError("Sign-out failed. Try again.");
      return;
    }
    await disconnectNearWallet();
    await cache.cancelQueries();
    cache.clear();
    // Retire pending wallet callbacks and the Router Cache together with this document.
    window.location.replace("/login");
  }

  return { pending, error, signOut: () => void signOut() };
}
