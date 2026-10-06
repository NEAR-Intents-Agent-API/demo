import { GuideDetailRow } from "./guide-detail-row";
import type { MOVES } from "./how-it-works-content";
import { WhoPill } from "./who-pill";

export function MoneyMoveRow({ move }: { move: (typeof MOVES)[number] }) {
  return (
    <GuideDetailRow
      title={move.verb}
      asset={move.asset}
      badge={
        <span className="[&>span]:w-[120px] sm:[&>span]:w-[141px]">
          <WhoPill who={move.who} />
        </span>
      }
    >
      <p className="text-sm leading-[23px]">{move.what}</p>
      <p className="text-[13px] leading-[21px] text-muted-foreground">{move.guard}</p>
    </GuideDetailRow>
  );
}
