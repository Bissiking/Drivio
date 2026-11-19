// Run exclusively against the disposable local instance documented in docs/2.2.0.md.
import assert from "node:assert/strict";
import { db } from "../src/lib/db";
import { homeDestination } from "../src/lib/experience";

async function main() {
  const url = new URL(process.env.DATABASE_URL ?? "file:invalid");
  assert.equal(url.hostname, "127.0.0.1"); assert.equal(url.port, "55449"); assert.equal(url.username, "drivio_mobile");
  const id = `mobile220-${Date.now()}`;
  try {
    const user = await db.user.create({ data: { id, kyrosSubject: id, themeMode: "light", themePalette: "slate", autoFuelMobile: true } });
    assert.equal(user.homePage, "auto"); assert.equal(user.interfaceStyle, "classic");
    const saved = await db.user.update({ where: { id }, data: { homePage: "add", interfaceStyle: "horizon" } });
    assert.equal(homeDestination(saved.homePage, false), "/ajouter");
    assert.equal(saved.themeMode, "light"); assert.equal(saved.themePalette, "slate"); assert.equal(saved.autoFuelMobile, true);
    await assert.rejects(db.$executeRaw`UPDATE "User" SET "homePage" = 'invalid' WHERE id = ${id}`);
    await assert.rejects(db.$executeRaw`UPDATE "User" SET "interfaceStyle" = 'invalid' WHERE id = ${id}`);
    const retained = await db.user.findUniqueOrThrow({ where: { id } });
    assert.equal(retained.homePage, "add"); assert.equal(retained.interfaceStyle, "horizon");
    console.log("PostgreSQL: generated-client defaults, saved experience preferences, retained appearance/fuel flags and SQL CHECK constraints passed.");
  } finally { await db.user.deleteMany({ where: { id } }); await db.$disconnect(); }
}
main().catch(error => { console.error(error); process.exitCode = 1; });
