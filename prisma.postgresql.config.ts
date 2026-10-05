import "dotenv/config";
import { defineConfig } from "prisma/config";
process.env.RUST_LOG ??= "info";
export default defineConfig({ schema: "prisma/schema.postgresql.prisma", migrations: { path: "prisma/migrations-postgresql" }, datasource: { url: process.env.DATABASE_URL } });
