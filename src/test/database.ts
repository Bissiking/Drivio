// src/test/database.ts
import { mkdtemp, readFile, readdir, rm } from "node:fs/promises";
import path from "node:path";
import os from "node:os";
import Database from "better-sqlite3";
import { PrismaBetterSqlite3 } from "@prisma/adapter-better-sqlite3";
import { PrismaClient } from "@/generated/prisma/client";
export async function testDatabase() {
  const directory = await mkdtemp(path.join(os.tmpdir(), "drivio-evolution-")), file = path.join(directory, "test.db"), sqlite = new Database(file);
  for (const name of (await readdir("prisma/migrations")).filter(n => /^\d/.test(n)).sort()) sqlite.exec(await readFile(`prisma/migrations/${name}/migration.sql`, "utf8"));
  const violations = sqlite.pragma("foreign_key_check"); sqlite.close();
  if ((violations as unknown[]).length) throw new Error("Migration foreign-key violation");
  const client = new PrismaClient({ adapter: new PrismaBetterSqlite3({ url: `file:${file}` }) });
  return { client, directory, close: async () => { await client.$disconnect(); await rm(directory, { recursive: true, force: true }); } };
}
