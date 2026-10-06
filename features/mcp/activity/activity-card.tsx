"use client";

import type { McpActivityView } from "../api";
import { McpActivityCards } from "./activity-cards";
import { McpActivityTable } from "./activity-table";

/**
 * Every tool call any client made, newest first.
 *
 * This is the only place a client has a name: the custody wallet sees only the account, so
 * without this feed a provider request is unattributable. The operation id links a call to the
 * operation it started, which is what a visitor follows to see where it ended up.
 */
export function McpActivityCard({ activity }: { activity: McpActivityView[] }) {
  return (
    <div className="min-w-0">
      {activity.length === 0 ? (
        <p className="px-4 py-4 text-sm text-muted-foreground sm:px-5">No client requests yet</p>
      ) : (
        <>
          <McpActivityCards activity={activity} />
          <McpActivityTable activity={activity} />
        </>
      )}
    </div>
  );
}
