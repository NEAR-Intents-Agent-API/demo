"use client";

import { type ReactNode, useContext } from "react";
import { createPortal } from "react-dom";
import { DialogFooterContext } from "./dialog-footer-context";

export function DialogFooter({ children }: { children: ReactNode }) {
  const target = useContext(DialogFooterContext);
  return target ? createPortal(children, target) : children;
}
