"use client";
import { createContext } from "react";

/** false hides nested flow actions when setup supplies a single combined footer. */
export const FlowFooterContext = createContext<HTMLElement | null | false>(null);
