// src/lib/fuel-sync.test.ts
import { afterAll, beforeAll, describe, expect, it, vi } from "vitest";
import { testDatabase } from "@/test/database";
const state = vi.hoisted(() => ({ db: null as unknown as import("@/generated/prisma/client").PrismaClient }));
vi.mock("./db", () => ({ get db() { return state.db; } }));
import { claimFuelSync, FuelSyncBusy, importFuelStations, syncFuelPrices } from "./fuel-sync";
import { parseFuelXml } from "./fuel-feed";
let database: Awaited<ReturnType<typeof testDatabase>>;
beforeAll(async () => { database = await testDatabase(); state.db = database.client; });
afterAll(async () => { await database.close(); });
const feed = (price = "1.800", declared = "2026-10-01 10:00:00", outage = '<rupture id="5" debut="2026-10-01 09:00:00" fin="" type="temporaire"/>', id = "75001001") => `<pdv_liste><pdv id="${id}" latitude="4885660" longitude="235220" cp="75001"><adresse>Rue du marché</adresse><ville>Paris</ville><prix id="1" valeur="${price}" maj="${declared}"/>${outage}</pdv></pdv_liste>`;
const run = async (xml: string, owner: string, minimum = 1) => { await claimFuelSync(owner); return importFuelStations(parseFuelXml(xml), owner, owner, new Date(), minimum); };
describe.sequential("import officiel transactionnel", () => {
  it("importe puis répète sans dupliquer les déclarations ou ruptures", async () => {
    expect(await run(feed(), "first")).toMatchObject({ created: 1, priceChanges: 1, declarations: 1 });
    expect(await run(feed(), "repeat")).toMatchObject({ unchanged: 1, priceChanges: 0 });
    expect(await state.db.fuelPriceHistory.count()).toBe(1); expect(await state.db.fuelOutage.count()).toBe(1);
  });
  it("historise une nouvelle déclaration au même prix et les variations de prix", async () => {
    expect(await run(feed("1.800", "2026-10-02 10:00:00"), "same-price")).toMatchObject({ priceChanges: 0, declarations: 1 });
    expect(await run(feed("1.900", "2026-10-03 10:00:00"), "change")).toMatchObject({ priceChanges: 1 });
    expect(await state.db.fuelPriceHistory.count()).toBe(3);
    expect((await state.db.fuelPrice.findFirstOrThrow()).declaredAt.toISOString()).toBe("2026-10-03T08:00:00.000Z");
  });
  it("distingue une fin constatée par absence d'une fin officielle", async () => {
    await run(feed("1.900", "2026-10-03 10:00:00", ""), "end");
    expect((await state.db.fuelOutage.findFirstOrThrow()).endSource).toBe("OBSERVED_ABSENCE");
    await run(feed("1.900", "2026-10-03 10:00:00", '<rupture id="5" debut="2026-10-01 09:00:00" fin="2026-10-04 10:00:00" type="temporaire"/>'), "official-end");
    expect((await state.db.fuelOutage.findFirstOrThrow()).endSource).toBe("OFFICIAL");
  });
  it("refuse deux propriétaires concurrents du verrou et autorise sa reprise après expiration", async () => {
    const results = await Promise.allSettled([claimFuelSync("worker-1"), claimFuelSync("worker-2")]);
    expect(results.filter(r => r.status === "fulfilled")).toHaveLength(1);
    const rejected = results.find(r => r.status === "rejected") as PromiseRejectedResult; expect(rejected.reason).toBeInstanceOf(FuelSyncBusy);
    await state.db.fuelSyncState.update({ where: { id: "fuel-prices-sync" }, data: { leaseUntil: new Date(0) } });
    await claimFuelSync("new-owner");
    await expect(importFuelStations(parseFuelXml(feed()), "hash", "worker-1", new Date(), 1)).rejects.toThrow("Bail");
    await state.db.fuelSyncState.update({ where: { id: "fuel-prices-sync" }, data: { leaseOwner: null, leaseUntil: null } });
  });
  it("annule toute écriture quand un flux régresse, puis permet la reprise", async () => {
    await claimFuelSync("rollback");
    const before = (await state.db.fuelStation.findFirstOrThrow()).fingerprint;
    await expect(importFuelStations(parseFuelXml(feed("1.700", "2026-09-01 10:00:00")), "bad", "rollback", new Date(), 1)).rejects.toThrow("antérieure");
    expect((await state.db.fuelStation.findFirstOrThrow()).fingerprint).toBe(before);
    expect(Number((await state.db.fuelPrice.findFirstOrThrow()).value)).toBe(1.9);
    await state.db.fuelSyncState.update({ where: { id: "fuel-prices-sync" }, data: { leaseOwner: null, leaseUntil: null } });
    expect(await run(feed("2.000", "2026-10-05 10:00:00"), "recovery")).toMatchObject({ priceChanges: 1 });
  });
  it("rejette un import incomplet et conserve les stations et historiques", async () => {
    await claimFuelSync("incomplete");
    await expect(importFuelStations([], "bad", "incomplete", new Date(), 1)).rejects.toThrow("incomplet");
    expect(await state.db.fuelStation.count()).toBe(1);
    await state.db.fuelSyncState.update({ where: { id: "fuel-prices-sync" }, data: { leaseOwner: null, leaseUntil: null } });
  });
  it("marque les stations absentes et les réactive sans perdre leur historique", async () => {
    await run(feed("1.800", "2026-10-01 10:00:00", "", "75001002"), "missing");
    expect((await state.db.fuelStation.findUniqueOrThrow({ where: { id: "75001001" } })).active).toBe(false);
    expect(await state.db.fuelPriceHistory.count({ where: { stationId: "75001001" } })).toBe(4);
    await run(feed("2.000", "2026-10-05 10:00:00"), "return");
    expect((await state.db.fuelStation.findUniqueOrThrow({ where: { id: "75001001" } })).active).toBe(true);
  });
  it("libère le verrou sur une erreur de téléchargement et garde le dernier succès", async () => {
    await expect(syncFuelPrices(async () => { throw new Error("Source en erreur"); })).rejects.toThrow("Source en erreur");
    expect(await state.db.fuelSyncState.findFirst()).toMatchObject({ status: "FAILED", leaseOwner: null, error: "Source en erreur" });
    expect(await state.db.fuelPriceHistory.count()).toBeGreaterThan(0);
  });
});
