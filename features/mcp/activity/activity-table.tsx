"use client";

import { Cursor01Icon } from "@hugeicons/core-free-icons";
import { HugeiconsIcon } from "@hugeicons/react";
import { StatusPill } from "@/components/shared/status";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { accountTimestamp } from "@/lib/format/date";
import type { McpActivityView } from "../api";
import { ActivityEntryDetails } from "./activity-entry-details";

export function McpActivityTable({ activity }: { activity: McpActivityView[] }) {
  return (
    <div className="hidden md:block">
      <Table aria-label="Client requests">
        <TableHeader>
          <TableRow>
            <TableHead className="console-table-head w-2/5 pl-5">Request</TableHead>
            <TableHead className="console-table-head">Result</TableHead>
            <TableHead className="console-table-head pr-5">When</TableHead>
            <TableHead className="console-table-head pr-5">Details</TableHead>
          </TableRow>
        </TableHeader>
        <TableBody>
          {activity.map((entry) => (
            <TableRow key={entry.id}>
              <TableCell className="py-4 pl-5 align-top">
                <span className="flex items-center gap-2 font-medium">
                  <HugeiconsIcon icon={Cursor01Icon} className="size-3.5 text-muted-foreground" />
                  {entry.clientName}
                </span>
                <code className="console-id mt-1 block text-muted-foreground">{entry.tool}</code>
              </TableCell>
              <TableCell className="py-4 align-top">
                <StatusPill
                  tone={entry.status === "error" ? "blocked" : "ok"}
                  className="capitalize"
                >
                  {entry.status}
                </StatusPill>
              </TableCell>
              <TableCell className="py-4 pr-5 align-top text-xs text-muted-foreground">
                {accountTimestamp(entry.createdAt)}
              </TableCell>
              <TableCell className="py-4 pr-5 align-top">
                <ActivityEntryDetails entry={entry} />
              </TableCell>
            </TableRow>
          ))}
        </TableBody>
      </Table>
    </div>
  );
}
