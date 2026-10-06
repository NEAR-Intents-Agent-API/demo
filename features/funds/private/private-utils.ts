export type Direction = "shield" | "unshield";

export const COPY: Record<
  Direction,
  { label: string; from: string; to: string; blurb: string; empty: string }
> = {
  shield: {
    label: "Shield",
    from: "Public balance",
    to: "Private balance",
    blurb:
      "Moves funds into the private balance, where amounts and transfers are not publicly visible.",
    empty: "Nothing in the public balance to move",
  },
  unshield: {
    label: "Unshield",
    from: "Private balance",
    to: "Public balance",
    blurb: "Moves funds back to the public NEAR Intents balance, where swaps and withdrawals run.",
    empty: "Nothing in the private balance to move",
  },
};
