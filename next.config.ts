// next.config.ts
import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  // Local browser recipes can isolate their cache from an active developer server.
  distDir: process.env.DRIVIO_BUILD_DIR ?? ".next",
  agentRules: false,
  serverExternalPackages: ["better-sqlite3"],
  async rewrites() {
    return { beforeFiles: [{ source: "/uploads/:name", destination: "/api/uploads/:name" }] };
  },
};

export default nextConfig;
