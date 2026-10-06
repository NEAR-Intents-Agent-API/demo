"use client";
import { useState } from "react";
import { formatUnits, parseUnits } from "@/lib/format/amount";

export function useTokenLimitField(raw: string, decimals: number, onRaw: (raw: string) => void) {
  const [text, setText] = useState(() => (raw ? formatUnits(raw, decimals) : ""));
  const atomic = text ? parseUnits(text, decimals) : null;
  const invalid = text !== "" && (atomic === null || atomic === 0n);
  const changeText = (value: string) => {
    const next = value.replace(/[^0-9.]/g, "");
    setText(next);
    const parsed = parseUnits(next, decimals);
    onRaw(parsed && parsed > 0n ? parsed.toString() : "");
  };
  return { text, atomic, invalid, changeText };
}
