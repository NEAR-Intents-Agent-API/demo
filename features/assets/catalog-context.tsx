"use client";

import { createContext, useContext } from "react";
import { type Catalog, useCatalogData } from "./use-catalog";

const CatalogContext = createContext<Catalog | null>(null);

/**
 * One catalogue read and one price clock for the whole authenticated tree. Screens read tokens
 * through `useCatalog`; nothing else mounts the query, so opening a second tab does not double
 * the polling or rebuild the token list per component.
 */
export function CatalogProvider({ children }: { children: React.ReactNode }) {
  const catalog = useCatalogData();
  return <CatalogContext.Provider value={catalog}>{children}</CatalogContext.Provider>;
}

export function useCatalog(): Catalog {
  const value = useContext(CatalogContext);
  if (!value) throw new Error("useCatalog outside the catalog provider");
  return value;
}
