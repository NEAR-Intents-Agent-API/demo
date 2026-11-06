export type Direction = "shield" | "unshield";

export const COPY: Record<
  Direction,
  { label: string; from: string; to: string; blurb: string; empty: string }
> = {
  shield: {
    label: "Make confidential",
    from: "Public balance",
    to: "Confidential balance",
    blurb:
      "Moves funds into the confidential balance, off the public NEAR chain. The move itself is public, and operators and solvers can still see the funds.",
    empty: "Nothing in the public balance to move",
  },
  unshield: {
    label: "Make public",
    from: "Confidential balance",
    to: "Public balance",
    blurb: "Moves funds back to the public NEAR Intents balance, where swaps and withdrawals run.",
    empty: "Nothing in the confidential balance to move",
  },
};
