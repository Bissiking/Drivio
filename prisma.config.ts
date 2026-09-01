// prisma.config.ts
import "dotenv/config";
import path from "node:path";
import { defineConfig } from "prisma/config";

// Prisma 7.10 sur Node 24/macOS doit initialiser le canal de logs du schema engine.
process.env.RUST_LOG ??= "info";

const configuredUrl = process.env.DATABASE_URL ?? "file:./prisma/dev.db";
const datasourceUrl = configuredUrl === "file:./prisma/dev.db"
  ? `file:${path.join(process.cwd(), "prisma", "dev.db")}`
  : configuredUrl;

export default defineConfig({
  schema: "prisma/schema.prisma",
  migrations: {
    path: "prisma/migrations",
    seed: "tsx prisma/seed.ts",
  },
  datasource: {
    url: datasourceUrl,
  },
});
