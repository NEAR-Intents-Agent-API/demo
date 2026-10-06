import { ResponsiveDialog } from "@/components/responsive-dialog";
import { Loading, Unavailable } from "@/components/shared/states";

export function DestinationsLoading({
  error,
  onRetry,
  onOpenChange,
}: {
  error: Error | null;
  onRetry: () => void;
  onOpenChange: (open: boolean) => void;
}) {
  return (
    <ResponsiveDialog
      open
      onOpenChange={onOpenChange}
      title="Destination rule"
      description="Loading account destinations and networks."
    >
      {error ? <Unavailable code={error.message} onRetry={onRetry} /> : <Loading rows={3} />}
    </ResponsiveDialog>
  );
}
