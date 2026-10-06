export type DepositSource = "network" | "intents";

export const DEPOSIT_SOURCES = [
  { value: "network", label: "From a network" },
  { value: "intents", label: "From NEAR Intents" },
] as const;
