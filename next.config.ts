// next.config.ts
import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  agentRules: false,
  serverExternalPackages: ["better-sqlite3"],
  async rewrites() {
    return { beforeFiles: [{ source: "/uploads/:name", destination: "/api/uploads/:name" }] };
  },
};

export default nextConfig;
