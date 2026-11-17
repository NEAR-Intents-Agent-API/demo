import { MonoId } from "@/components/shared/identifiers";
import { accountTimestamp } from "@/lib/format/date";
import { type ApprovalVote, describeVoter } from "./approval-display-utils";

/** Who voted on an approval and how, oldest first; nothing when no vote was recorded. */
export function ApprovalVotes({ votes }: { votes: readonly ApprovalVote[] }) {
  if (votes.length === 0) return null;
  return (
    <ul className="space-y-1 text-xs text-muted-foreground" data-testid="approval-votes">
      {votes.map((vote) => {
        const { account, method } = describeVoter(vote.voter);
        return (
          <li
            key={`${vote.voter}:${vote.voted_at}`}
            className="flex flex-wrap items-center gap-1.5"
          >
            <span className="font-medium text-foreground">
              {vote.verdict === "approve" ? "Approved" : "Rejected"}
            </span>
            <span>by</span>
            <MonoId value={account} head={10} tail={6} className="text-xs" />
            <span>
              ({method}) · {accountTimestamp(vote.voted_at)}
            </span>
          </li>
        );
      })}
    </ul>
  );
}
