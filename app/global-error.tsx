"use client";

import "./globals.css";
import { RouteError } from "@/components/shared/route-error";

export default function GlobalError({ retry }: { retry: () => void }) {
  return (
    <html lang="en">
      <body>
        <title>Unable to load · Agent Connect</title>
        <RouteError retry={retry} />
      </body>
    </html>
  );
}
