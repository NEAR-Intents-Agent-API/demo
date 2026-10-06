import type { CatalogOption } from "@/features/assets";

export type SummaryCatalog = {
  tokens: readonly CatalogOption[];
  lookup: (assetId: string) => CatalogOption;
};
