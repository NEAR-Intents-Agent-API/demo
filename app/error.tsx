"use client";
import { RouteError } from "@/components/shared/route-error";

export default function ErrorPage({ retry }: { retry: () => void }) {
  return <RouteError retry={retry} />;
}
