import { afterAll, beforeAll, describe, expect, it, vi } from "vitest";
import Database from "better-sqlite3";
import { readdir, readFile } from "node:fs/promises";
import { testDatabase } from "@/test/database";
const state = vi.hoisted(() => ({ db: null as unknown as import("@/generated/prisma/client").PrismaClient, userId: "owner" as string | null }));
vi.mock("@/lib/db", () => ({ get db() { return state.db; } }));
vi.mock("@/lib/auth", () => ({ getCurrentUser: async () => state.userId ? { id: state.userId } : null }));
import { PATCH } from "@/app/api/preferences/experience/route";
import { experienceSchema, homeDestination } from "./experience";
let fixture: Awaited<ReturnType<typeof testDatabase>>;
const request = (body: object, origin?: string) => new Request("http://localhost/api/preferences/experience", { method: "PATCH", headers: { "content-type": "application/json", ...(origin ? { origin } : {}) }, body: JSON.stringify(body) });
beforeAll(async () => {
  fixture = await testDatabase(); state.db = fixture.client;
  await state.db.user.createMany({ data: [{ id: "owner", kyrosSubject: "owner", themeMode: "light", autoFuelMobile: true }, { id: "other", kyrosSubject: "other" }] });
});
afterAll(async () => fixture?.close());
describe("accueil et interface", () => {
  it.each([
    ["auto", false, "/dashboard"], ["auto", true, "/ajouter"],
    ["dashboard", false, "/dashboard"], ["dashboard", true, "/dashboard"],
    ["add", false, "/ajouter"], ["add", true, "/ajouter"],
  ] as const)("résout %s en mode installé %s", (home, installed, target) => {
    expect(homeDestination(home, installed)).toBe(target);
  });
  it("enregistre sur le seul compte connecté sans altérer apparence ni plein automatique", async () => {
    const response = await PATCH(request({ homePage: "add", interfaceStyle: "horizon" }));
    expect(response.status).toBe(200); expect(response.headers.get("cache-control")).toContain("no-store");
    expect(await state.db.user.findUniqueOrThrow({ where: { id: "owner" } })).toMatchObject({ homePage: "add", interfaceStyle: "horizon", themeMode: "light", autoFuelMobile: true });
    expect(await state.db.user.findUniqueOrThrow({ where: { id: "other" } })).toMatchObject({ homePage: "auto", interfaceStyle: "classic" });
    expect((await PATCH(request({ homePage: "auto", interfaceStyle: "classic" }))).status).toBe(200);
  });
  it("refuse les valeurs inconnues, champs tiers et origines étrangères", async () => {
    for (const body of [{ homePage: "https://evil.test", interfaceStyle: "horizon" }, { homePage: "auto", interfaceStyle: "nova" }, { homePage: "auto", interfaceStyle: "classic", userId: "other" }, { interfaceStyle: "horizon" }]) {
      expect(experienceSchema.safeParse(body).success).toBe(false);
      expect((await PATCH(request(body))).status).toBe(400);
    }
    expect((await PATCH(request({ homePage: "add", interfaceStyle: "horizon" }, "https://evil.test"))).status).toBe(403);
  });
  it("exige une session", async () => {
    state.userId = null;
    try { expect((await PATCH(request({ homePage: "add", interfaceStyle: "horizon" }))).status).toBe(401); }
    finally { state.userId = "owner"; }
  });
  it("ajoute les préférences aux données historiques sans modifier leurs choix existants", async () => {
    const sqlite = new Database(":memory:"), target = "20261119110000_mobile_experience";
    try {
      for (const name of (await readdir("prisma/migrations")).filter(name => /^\d/.test(name) && name < target).sort()) sqlite.exec(await readFile(`prisma/migrations/${name}/migration.sql`, "utf8"));
      sqlite.exec(`INSERT INTO "User"(id, kyrosSubject, themeMode, themePalette, autoFuelMobile, updatedAt) VALUES ('legacy', 'legacy', 'light', 'slate', 1, CURRENT_TIMESTAMP)`);
      sqlite.exec(await readFile(`prisma/migrations/${target}/migration.sql`, "utf8"));
      expect(sqlite.prepare('SELECT homePage, interfaceStyle, themeMode, themePalette, autoFuelMobile FROM "User"').get()).toEqual({ homePage: "auto", interfaceStyle: "classic", themeMode: "light", themePalette: "slate", autoFuelMobile: 1 });
      expect(() => sqlite.exec(`UPDATE "User" SET interfaceStyle='nova'`)).toThrow();
      expect(() => sqlite.exec(`UPDATE "User" SET homePage='unknown'`)).toThrow();
      expect(sqlite.pragma("foreign_key_check")).toEqual([]);
    } finally { sqlite.close(); }
  });
});
