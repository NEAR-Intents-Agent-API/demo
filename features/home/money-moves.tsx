import { MOVES } from "./how-it-works-content";
import { MoneyMoveRow } from "./money-move-row";

export function MoneyMoves() {
  return (
    <section
      aria-labelledby="moves-title"
      className="flex min-w-0 flex-col gap-6 lg:pr-10 xl:pr-12"
    >
      <div>
        <h2 id="moves-title" className="text-[22px] leading-7 font-bold tracking-[-0.35px]">
          What Your Agent Can Do
        </h2>
        <p className="mt-2 text-sm leading-[22px] text-muted-foreground">
          The same five actions are available from the Wallet screen and any connected client.
        </p>
      </div>
      <ul className="w-full divide-y divide-border">
        {MOVES.map((move) => (
          <MoneyMoveRow key={move.verb} move={move} />
        ))}
      </ul>
    </section>
  );
}
