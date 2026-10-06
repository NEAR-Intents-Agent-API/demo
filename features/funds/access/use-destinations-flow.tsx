"use client";

import { useCallback, useState } from "react";
import { fundsApi } from "../api";
import { useDestinations } from "../use-funds";
import type { DestinationContext } from "./destination-utils";
import { DestinationsDialog } from "./destinations-dialog";
import { DestinationsLoading } from "./destinations-loading";
import { useAccessSignature } from "./use-access-signature";

/** Editing account destinations never renews dashboard or client grants. */
export function useDestinationsFlow(agentId: string) {
  const [open, setOpen] = useState(false);
  const [initial, setInitial] = useState<DestinationContext>();
  const destinations = useDestinations(agentId);
  const signature = useAccessSignature(agentId, () => setOpen(false));
  const manageDestinations = useCallback(
    (context?: DestinationContext) => {
      signature.reset();
      setInitial(context);
      setOpen(true);
      void destinations.refetch();
    },
    [signature.reset, destinations.refetch],
  );
  const changeOpen = (value: boolean) => {
    if (!value && !signature.busy) {
      setOpen(false);
      signature.reset();
    }
  };
  return {
    manageDestinations,
    busy: signature.busy,
    dialogs: !open ? null : destinations.data ? (
      <DestinationsDialog
        key={`${destinations.data.revision}:${initial?.action}:${initial?.chain}`}
        open
        onOpenChange={changeOpen}
        current={destinations.data}
        initial={initial}
        {...signature}
        onSubmit={(rule, expectedRevision) =>
          signature.sign(() => fundsApi.updateDestinations(agentId, { rule, expectedRevision }))
        }
      />
    ) : (
      <DestinationsLoading
        error={destinations.error}
        onRetry={() => void destinations.refetch()}
        onOpenChange={changeOpen}
      />
    ),
  };
}
