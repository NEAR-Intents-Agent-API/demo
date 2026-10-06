"use client";
import { useQueryClient } from "@tanstack/react-query";
import { useEffect, useState } from "react";
import { authClient } from "@/lib/auth/client";

/**
 * Tracks the browser session through Better Auth's own store: sign-in, sign-out, expiry refresh
 * and cross-tab sign-out all notify the same signal, so no polling or 401 interception is needed.
 *
 * The server rendered the tree for one `userId`. If the live session now resolves a different
 * one, the cache belongs to the wrong identity: drop it and reload so every component remounts
 * with matching server props.
 */
export function useSessionSync(userId: string | null) {
  const cache = useQueryClient();
  const { data, isPending } = authClient.useSession();
  const [retired, setRetired] = useState(false);
  const liveUserId = data?.user?.id ?? null;
  const changed = !isPending && liveUserId !== userId;

  useEffect(() => {
    if (!changed || retired) return;
    setRetired(true);
    void cache.cancelQueries();
    cache.clear();
    window.location.reload();
  }, [cache, changed, retired]);

  return changed;
}
