// src/lib/evolution-api.test.ts
import { beforeAll, afterAll, describe, expect, it, vi } from "vitest";
import { NextRequest } from "next/server";
import { PDFDocument } from "pdf-lib";
import { testDatabase } from "@/test/database";
const state = vi.hoisted(() => ({ db: null as unknown as import("@/generated/prisma/client").PrismaClient, userId: "owner" as string | null, loginId: "login-one", sync: vi.fn() }));
vi.mock("./db", () => ({ get db() { return state.db; } }));
vi.mock("./auth", () => ({ getCurrentUser: async () => state.userId ? state.db.user.findUnique({ where: { id: state.userId } }) : null, getSession: async () => state.userId ? { userId: state.userId, loginId: state.loginId, refreshExpiresAt: Date.now() + 86400000 } : null }));
vi.mock("./fuel-sync", () => ({ syncFuelPrices: state.sync, FuelSyncBusy: class FuelSyncBusy extends Error {} }));
import { POST as exportReport } from "@/app/api/reports/route";
import { GET as searchStations } from "@/app/api/fuel-stations/route";
import { GET as stationHistory } from "@/app/api/fuel-stations/[id]/route";
import { POST as measureTire } from "@/app/api/tire-measurements/route";
import { PATCH as savePreferences } from "@/app/api/preferences/route";
import { POST as claimPrompt } from "@/app/api/preferences/fuel-prompt/route";
import { PATCH as saveCycle } from "@/app/api/maintenance/[id]/baseline/route";
import { POST as addMaintenance } from "@/app/api/maintenance/route";
import { PATCH as completeMaintenance } from "@/app/api/maintenance/[id]/route";
import { GET as manifest } from "@/app/api/aion/manifest/route";
import { POST as startJob } from "@/app/api/aion/jobs/[slug]/start/route";
import { reportContent, reportSchema, generateReport } from "./reports";
import { vehicleWorkspace } from "./vehicle-workspace";
let fixture: Awaited<ReturnType<typeof testDatabase>>;
const request = (body: object, method = "POST") => new NextRequest("http://localhost/api", { method, headers: { "content-type": "application/json" }, body: JSON.stringify(body) });
const options = { vehicleId: "car", template: "sale", from: "2026-01-01", to: "2026-12-31", sections: ["vehicle", "mileage", "statistics", "costs", "maintenance", "schedules"] };
beforeAll(async () => {
  fixture = await testDatabase(); state.db = fixture.client;
  await state.db.user.createMany({ data: [{ id: "owner", kyrosSubject: "owner", email: "private@example.test" }, { id: "outsider", kyrosSubject: "outsider" }] });
  for (const [id, userId] of [["car", "owner"], ["other", "outsider"]]) {
    await state.db.vehicle.create({ data: { id, userId, brand: "Peugeot", model: "308", trim: "GT", year: 2022, purchaseDate: new Date("2026-01-01"), purchaseMileage: 10000, registration: "SECRET-PLATE", vin: "SECRET-VIN-1234567" } });
    await state.db.tireSet.create({ data: { id: `${id}-tire`, vehicleId: id, brand: "Test", dimensions: "205/55 R16", type: "ETE", position: "AVANT", mountedAt: new Date("2026-01-01"), mountedMileage: 10000 } });
    await state.db.vehicleDocument.create({ data: { id: `${id}-doc`, vehicleId: id, title: "SECRET-DOCUMENT", category: "FACTURE", date: new Date("2026-02-01"), storageKey: `${id}-private.pdf`, originalName: "SECRET-NAME.pdf", mimeType: "application/pdf", size: 10 } });
  }
  await state.db.maintenanceRecord.create({ data: { vehicleId: "car", type: "VIDANGE", title: "SECRET-PERSON-NAME", date: new Date("2026-02-01"), cost: 200, notes: "SECRET-NOTES" } });
});
afterAll(async () => { await fixture.close(); vi.unstubAllEnvs(); });
describe.sequential("sécurité et exports des évolutions", () => {
  it("valide et protège les références de jauge sans modifier la clôture des échéances", async () => {
    const data = { kind: "schedule", vehicleId: "car", type: "VIDANGE", title: "Vidange", dueDate: "2027-01-01", dueMileage: 20000, warningDays: 30, warningKm: 1500, cycleStartDate: "2026-01-01", cycleStartMileage: 10000 };
    expect((await addMaintenance(request({ ...data, cycleStartMileage: 20000 }))).status).toBe(400);
    const response = await addMaintenance(request(data)); expect(response.status).toBe(201);
    const { schedule } = await response.json(), context = { params: Promise.resolve({ id: schedule.id }) };
    expect(schedule.cycleStartMileage).toBe(10000);
    state.userId = "outsider"; expect((await saveCycle(request({}, "PATCH"), context)).status).toBe(404);
    state.userId = null; expect((await saveCycle(request({}, "PATCH"), context)).status).toBe(401);
    state.userId = "owner";
    expect((await saveCycle(request({ cycleStartDate: "2099-01-01" }, "PATCH"), context)).status).toBe(400);
    expect((await saveCycle(request({ cycleStartMileage: 25000 }, "PATCH"), context)).status).toBe(400);
    expect((await saveCycle(request({ cycleStartDate: "2026-02-01", cycleStartMileage: 12000 }, "PATCH"), context)).status).toBe(200);
    expect(await state.db.maintenanceSchedule.findUnique({ where: { id: schedule.id } })).toMatchObject({ completedAt: null, cycleStartMileage: 12000 });
    expect((await saveCycle(request({ cycleStartDate: "", cycleStartMileage: "" }, "PATCH"), context)).status).toBe(200);
    expect(await state.db.maintenanceSchedule.findUnique({ where: { id: schedule.id } })).toMatchObject({ cycleStartDate: null, cycleStartMileage: null });
    expect((await completeMaintenance(request({}, "PATCH"), context)).status).toBe(200);
    expect((await saveCycle(request({}, "PATCH"), context)).status).toBe(409);
  });
  it("refuse toutes les API personnelles sans session", async () => {
    state.userId = null;
    expect((await exportReport(request(options))).status).toBe(401);
    expect((await measureTire(request({}))).status).toBe(401);
    expect((await searchStations(new Request("http://localhost/api?area=Paris"))).status).toBe(401);
    expect((await savePreferences(request({}, "PATCH"))).status).toBe(401);
    expect((await claimPrompt(request({ device: "mobile" }))).status).toBe(401);
    state.userId = "owner";
  });
  it("refuse un véhicule, un pneu, un justificatif et des comparaisons appartenant à autrui", async () => {
    expect((await exportReport(request({ ...options, vehicleId: "other" }))).status).toBe(404);
    expect((await exportReport(request({ ...options, includeSensitive: true, attachmentIds: ["other-doc"] }))).status).toBe(404);
    expect((await measureTire(request({ tireSetId: "other-tire", date: "2026-03-01", mileage: 11000, treadDepthMm: 6 }))).status).toBe(404);
    expect((await stationHistory(new Request("http://localhost/api?fuel=1&vehicle=other"), { params: Promise.resolve({ id: "1" }) })).status).toBe(404);
  });
  it("masque les champs sensibles, les textes libres et les pièces par défaut", async () => {
    const { vehicle } = await vehicleWorkspace("owner", "car");
    const content = reportContent(vehicle!, reportSchema.parse(options)), serialized = JSON.stringify(content);
    for (const secret of ["SECRET-PLATE", "SECRET-VIN", "SECRET-PERSON", "SECRET-NOTES", "SECRET-NAME", "private@example.test"]) expect(serialized).not.toContain(secret);
    expect(content.privateMode).toBe(true);
    expect((await exportReport(request({ ...options, attachmentIds: ["car-doc"] }))).status).toBe(400);
    expect((await exportReport(request({ ...options, from: "2027-01-01" }))).status).toBe(400);
  });
  it("produit les trois modèles PDF en téléchargement privé", async () => {
    for (const template of ["summary", "maintenance", "sale"]) {
      const response = await exportReport(request({ ...options, template }));
      expect(response.status).toBe(200); expect(response.headers.get("cache-control")).toBe("private, no-store");
      expect(response.headers.get("content-type")).toBe("application/pdf");
      const pdf = await PDFDocument.load(await response.arrayBuffer()); expect(pdf.getPageCount()).toBeGreaterThan(0); expect(pdf.getTitle()).toContain("Drivio");
    }
  });
  it("pagine les tableaux longs et reproduit une annexe PDF sans annotations interactives", async () => {
    const source = await PDFDocument.create(); source.addPage();
    const pdf = await generateReport({ title: "Test de pagination", vehicle: "Test véhicule", period: "2026", privateMode: false, sections: [{ title: "Interventions", columns: ["Date", "Détail"], rows: Array.from({ length: 100 }, (_, i) => [String(i), "Intervention enregistrée avec des accents : été, contrôle et révision."]) }] }, [{ bytes: await source.save(), mime: "application/pdf" }]);
    expect((await PDFDocument.load(pdf)).getPageCount()).toBeGreaterThan(4);
  });
  it("enregistre une mesure réelle et refuse une date, un compteur ou un doublon incohérent", async () => {
    const body = { tireSetId: "car-tire", date: "2026-03-01", mileage: 11000, treadDepthMm: 6, targetDepthMm: 2, replacementCost: 300 };
    expect((await measureTire(request(body))).status).toBe(201);
    expect((await measureTire(request(body))).status).toBe(409);
    expect((await measureTire(request({ ...body, mileage: 9000 }))).status).toBe(400);
    expect((await measureTire(request({ ...body, date: "2099-01-01" }))).status).toBe(400);
    expect((await state.db.tireMeasurement.findFirstOrThrow()).treadDepthMm.toString()).toBe("6");
    expect((await measureTire(request({ ...body, date: "2026-04-01", mileage: 12000, treadDepthMm: "" }))).status).toBe(400);
    expect((await measureTire(request({ ...body, date: "2026-04-01", mileage: 12000, treadDepthMm: 0 }))).status).toBe(201);
  });
  it("cherche géographiquement et exclut des estimations les ruptures ou disponibilités incertaines", async () => {
    for (const [id, latitude, uncertain, outage] of [["10001", 48.8566, false, false], ["10002", 48.8566, false, true], ["10003", 48.8566, true, false], ["10004", 45.764, false, false]] as const) await state.db.fuelStation.create({ data: { id, address: "Test", city: "Paris", postalCode: "75001", searchText: "paris 75001 test", latitude, longitude: 2.3522, availabilityUncertain: uncertain, fingerprint: id, lastSeenAt: new Date(), prices: { create: { fuelId: "1", value: 1.8, declaredAt: new Date("2026-01-01") } }, ...(outage ? { outages: { create: { fuelId: "1", type: "temporaire", startedAt: new Date("2026-01-01"), endedAt: new Date("2099-01-01"), endSource: "OFFICIAL" } } } : {}) } });
    const response = await searchStations(new Request("http://localhost/api?lat=48.8566&lon=2.3522&radius=5&fuel=1&liters=40"));
    expect(response.status).toBe(200);
    const result = await response.json(); expect(result.stations).toHaveLength(3);
    expect(result.stations.find((s: { id: string }) => s.id === "10001")).toMatchObject({ estimatedFill: 72, stale: true });
    expect(result.stations.find((s: { id: string }) => s.id === "10002")).toMatchObject({ estimatedFill: null, outage: { type: "temporaire" } });
    expect(result.stations.find((s: { id: string }) => s.id === "10003")).toMatchObject({ estimatedFill: null, availabilityUncertain: true });
  });
  it("désactive la modale par défaut, persiste chaque appareil et ne réclame qu'une fois une session", async () => {
    expect((await (await claimPrompt(request({ device: "mobile" }))).json()).open).toBe(false);
    expect((await savePreferences(request({ autoFuelMobile: true, autoFuelDesktop: false }, "PATCH"))).status).toBe(200);
    expect((await (await claimPrompt(request({ device: "desktop" }))).json()).open).toBe(false);
    const responses = await Promise.all([claimPrompt(request({ device: "mobile" })), claimPrompt(request({ device: "mobile" }))]);
    const payloads = await Promise.all(responses.map(r => r.json())); expect(payloads.filter(p => p.open)).toHaveLength(1);
    expect((await (await claimPrompt(request({ device: "mobile" }))).json()).open).toBe(false);
    state.loginId = "login-two";
    expect((await (await claimPrompt(request({ device: "mobile" }))).json()).open).toBe(true);
  });
  it("protège le contrat Aion avec la clé entrante et respecte son résultat synchrone", async () => {
    vi.stubEnv("AION_API_KEY", "test-incoming-key-with-at-least-32-characters");
    expect((await manifest(new Request("http://localhost/api"))).status).toBe(401);
    expect((await startJob(new Request("http://localhost/api"), { params: Promise.resolve({ slug: "fuel-prices-sync" }) })).status).toBe(401);
    expect(state.sync).not.toHaveBeenCalled();
    const authorized = () => new Request("http://localhost/api", { method: "POST", headers: { authorization: `Bearer ${process.env.AION_API_KEY}` } });
    expect((await manifest(authorized())).status).toBe(200);
    expect((await startJob(authorized(), { params: Promise.resolve({ slug: "unknown" }) })).status).toBe(404);
    state.sync.mockResolvedValue({ executionId: "exec-test", stats: { stations: 10000 } });
    const response = await startJob(authorized(), { params: Promise.resolve({ slug: "fuel-prices-sync" }) });
    expect(await response.json()).toMatchObject({ execution_id: "exec-test", status: "success", exit_code: 0, stats: { stations: 10000 } });
  });
});
