"use client";
import type { Destination } from "@near-intents-agent-api/sdk";
import { useState } from "react";
import {
  type DestinationAction,
  type DestinationContext,
  destinationFromDraft,
} from "./destination-utils";

export function useDestinationDraft(
  onAdd: (destination: Destination) => void,
  initial?: DestinationContext,
) {
  const [action, setAction] = useState<DestinationAction>(initial?.action ?? "withdraw");
  const [chain, setChain] = useState(initial?.chain ?? "");
  const [address, setAddress] = useState("");
  const [memo, setMemo] = useState("");
  const [hasMemo, setHasMemo] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const add = () => {
    try {
      onAdd(destinationFromDraft({ action, chain, address, memo, hasMemo }));
      setAddress("");
      setMemo("");
      setHasMemo(false);
      setError(null);
    } catch {
      setError(
        "Choose a network, enter a recipient, and fill in the memo if required. Memo values must match exactly.",
      );
    }
  };
  return {
    action,
    setAction: (next: DestinationAction) => {
      setAction(next);
      setAddress("");
      setMemo("");
      setHasMemo(false);
      setError(null);
    },
    chain,
    setChain: (next: string) => {
      setChain(next);
      setMemo("");
      setHasMemo(false);
      setError(null);
    },
    address,
    setAddress,
    memo,
    setMemo,
    hasMemo,
    setHasMemo: (enabled: boolean) => {
      setHasMemo(enabled);
      if (!enabled) setMemo("");
    },
    error,
    add,
    pending: Boolean(address || memo || hasMemo),
  };
}
