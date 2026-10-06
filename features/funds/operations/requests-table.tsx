"use client";
import type { StatusResponse } from "@near-intents-agent-api/sdk";
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

import { humanize, operationActionLabel, statusTone } from "./operation-display-utils";
import { RequestDetails } from "./request-details";
import { RequestsCards } from "./requests-cards";

export function RequestsTable({ operations }: { operations: StatusResponse[] }) {
  if (operations.length === 0) {
    return (
      <p className="px-4 py-4 text-sm text-muted-foreground sm:px-5">No wallet operations yet</p>
    );
  }

  return (
    <>
      <RequestsCards operations={operations} />
      <div className="hidden md:block">
        <Table aria-label="Wallet operations">
          <TableHeader>
            <TableRow>
              <TableHead className="console-table-head w-2/5 pl-5">Action</TableHead>
              <TableHead className="console-table-head">Status</TableHead>
              <TableHead className="console-table-head">When</TableHead>
              <TableHead className="console-table-head pr-5">Details</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {operations.map((operation) => {
              const status = operation.status;
              return (
                <TableRow key={operation.correlation_id}>
                  <TableCell className="py-4 pl-5 align-top font-medium">
                    {operationActionLabel(operation)}
                  </TableCell>
                  <TableCell className="py-4 align-top">
                    <StatusPill tone={statusTone(status)} className="capitalize">
                      {humanize(status)}
                    </StatusPill>
                  </TableCell>
                  <TableCell className="py-4 align-top text-xs text-muted-foreground">
                    {accountTimestamp(operation.created_at)}
                  </TableCell>
                  <TableCell className="py-4 pr-5 align-top">
                    <RequestDetails operation={operation} />
                  </TableCell>
                </TableRow>
              );
            })}
          </TableBody>
        </Table>
      </div>
    </>
  );
}
