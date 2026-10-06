"use client";
import Link from "next/link";
import { Button, buttonVariants } from "@/components/ui/button";

export function RouteError({ retry }: { retry: () => void }) {
  return (
    <section className="mx-auto flex max-w-xl flex-col gap-4 px-4 py-12" role="alert">
      <h1 className="text-xl font-semibold">This page could not load</h1>
      <p className="text-sm text-muted-foreground">
        Try loading it again. Wallet actions already submitted can be checked from the agent
        account.
      </p>
      <div className="flex flex-wrap gap-2">
        <Button onClick={retry}>Try again</Button>
        <Link href="/agents" className={buttonVariants({ variant: "outline" })}>
          Agent accounts
        </Link>
      </div>
    </section>
  );
}
