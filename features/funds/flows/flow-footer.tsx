"use client";
import { type ReactNode, useContext } from "react";
import { createPortal } from "react-dom";
import { FlowFooterContext } from "./flow-footer-context";

/** The same action stays inline outside dialogs and pinned below scrollable dialog content. */
export function FlowFooter({ children }: { children: ReactNode }) {
  const target = useContext(FlowFooterContext);
  if (target === false) return null;
  return target ? createPortal(children, target) : children;
}
