"use client";
import { useSessionSync } from "@/lib/auth/use-session-sync";

export function SessionBoundary({
  userId,
  children,
}: {
  userId: string | null;
  children: React.ReactNode;
}) {
  const changed = useSessionSync(userId);
  if (changed)
    return (
      <p role="status" className="p-8 text-sm text-muted-foreground">
        Refreshing your session…
      </p>
    );
  return children;
}
