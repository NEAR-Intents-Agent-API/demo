import path from "node:path";
import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  serverExternalPackages: ["@electric-sql/pglite"],
  outputFileTracingIncludes: { "/*": ["./drizzle/**/*"] },
  // Workspace packages emit ESM to `dist` and TypeScript declarations beside their sources.
  // They are built before the demo (`turbo build` dependsOn `^build`), so no transpilation
  // or extension rewriting is needed here.
  turbopack: {
    root: path.join(__dirname, "..", ".."),
  },
};

export default nextConfig;
