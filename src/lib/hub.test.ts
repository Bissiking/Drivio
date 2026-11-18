import { afterAll, beforeAll, describe, expect, it, vi } from "vitest";
import { testDatabase } from "@/test/database";
const state = vi.hoisted(() => ({ db: null as unknown as import("@/generated/prisma/client").PrismaClient, userId: "owner" as string | null }));
vi.mock("@/lib/db", () => ({ get db() { return state.db; } }));
vi.mock("@/lib/auth", () => ({ getCurrentUser: async () => state.userId ? { id: state.userId } : null }));
import { POST as issue, DELETE as revoke } from "@/app/api/preferences/hub/route";
import { GET as vehicles } from "@/app/api/hub/v1/vehicles/route";
import { GET as summary } from "@/app/api/hub/v1/summary/route";
import { hashHubToken } from "./hub";
let fixture: Awaited<ReturnType<typeof testDatabase>>, token: string;
const manage = (method = "POST", origin?: string) => new Request("http://localhost/api/preferences/hub", { method, headers: origin ? { origin } : {} });
const request = (path: string, bearer = token) => new Request(`http://localhost/api/hub/v1/${path}`, { headers: bearer ? { authorization: `Bearer ${bearer}` } : {} });
beforeAll(async () => {
  fixture = await testDatabase(); state.db = fixture.client;
  await state.db.user.createMany({ data: [{ id: "owner", kyrosSubject: "owner", email: "private@example.test" }, { id: "outsider", kyrosSubject: "outsider" }] });
  for (const [id, userId] of [["car", "owner"], ["other", "outsider"]]) await state.db.vehicle.create({ data: { id, userId, brand: "Test", model: "Car", trim: "V", year: 2024, purchaseDate: new Date("2026-01-01"), purchaseMileage: 1000, vin: "PRIVATE_VIN" } });
  await state.db.mileageReading.create({ data: { vehicleId: "car", mileage: 1500, date: new Date("2026-02-01") } });
  await state.db.maintenanceSchedule.create({ data: { vehicleId: "car", type: "VIDANGE", title: "Vidange moteur", dueMileage: 1400 } });
  await state.db.expense.create({ data: { vehicleId: "car", category: "AUTRE", amount: 12, date: new Date(), comment: "Private note" } });
});
afterAll(async () => fixture.close());
describe.sequential("API Hub LUMA v1", () => {
  it("exige une session Kyros pour créer un accès et refuse les origines tierces", async () => {
    state.userId = null; expect((await issue(manage())).status).toBe(401); state.userId = "owner";
    expect((await issue(manage("POST", "https://evil.test"))).status).toBe(403);
  });
  it("accepte l’origine publique canonique derrière un proxy", async () => {
    vi.stubEnv("NEXT_PUBLIC_APP_URL", "https://drivio.example.test");
    try { expect((await issue(manage("POST", "https://drivio.example.test"))).status).toBe(200); }
    finally { vi.unstubAllEnvs(); }
  });
  it("crée un jeton aléatoire dont seule l’empreinte est stockée", async () => {
    const response = await issue(manage()); const body = await response.json(); token = body.token;
    expect(token).toMatch(/^drv_hub_[A-Za-z0-9_-]{43}$/); expect(body.scope).toBe("widgets:read");
    const owner = await state.db.user.findUniqueOrThrow({ where: { id: "owner" } });
    expect(owner.hubTokenHash).toBe(hashHubToken(token)); expect(owner.hubTokenHash).not.toContain(token);
    expect(new Date(body.expiresAt).getTime() - Date.now()).toBeGreaterThan(89 * 86400000);
  });
  it("refuse un cookie seul et tout jeton invalide, sans cache", async () => {
    for (const bearer of ["", "invalid", `drv_hub_${"x".repeat(43)}`]) {
      const response = await vehicles(request("vehicles", bearer)); expect(response.status).toBe(401);
      expect(response.headers.get("cache-control")).toContain("no-store"); expect(response.headers.get("www-authenticate")).toContain("Bearer");
    }
  });
  it("ne retourne que les véhicules du propriétaire et les données utiles", async () => {
    const response = await vehicles(request("vehicles")), body = await response.json();
    expect(body.vehicles.map((v: { id: string }) => v.id)).toEqual(["car"]); expect(body.vehicles[0].mileage.value).toBe(1500);
    expect(JSON.stringify(body)).not.toMatch(/PRIVATE_VIN|private@example|kyrosSubject|hubTokenHash/);
    expect((await vehicles(request("vehicles?offset=-1"))).status).toBe(400);
  });
  it("isole la synthèse et calcule les échéances sans inventer de consommation", async () => {
    expect((await summary(request("summary?vehicle=other"))).status).toBe(404);
    expect((await summary(request("summary"))).status).toBe(400);
    const response = await summary(request("summary?vehicle=car")), body = await response.json();
    expect(body.maintenance.items[0].status).toBe("OVERDUE"); expect(body.fuel.consumptionPer100Km).toBeNull();
    expect(body.expenses.month.total).toBe(12); expect(body.expenses.recent).toHaveLength(1);
    expect(JSON.stringify(body)).not.toContain("Private note");
  });
  it("borne les échantillons et signale les données tronquées", async () => {
    await state.db.fuelEntry.createMany({ data: Array.from({ length: 103 }, (_, i) => ({ vehicleId: "car", date: new Date(Date.UTC(2026, 0, 1 + i)), mileage: 1000 + i * 100, liters: 10, totalPrice: 20, unitPrice: 2 })) });
    const body = await (await summary(request("summary?vehicle=car"))).json();
    expect(body.fuel.entriesInSample).toBe(100); expect(body.fuel.truncated).toBe(true); expect(body.fuel.consumptionPer100Km).toBe(10);
    await state.db.vehicle.createMany({ data: Array.from({ length: 51 }, (_, i) => ({ userId: "owner", brand: "Test", model: String(i), trim: "V", year: 2024, purchaseDate: new Date("2026-01-01"), purchaseMileage: 0 })) });
    const page = await (await vehicles(request("vehicles"))).json(); expect(page.vehicles).toHaveLength(50); expect(page.nextOffset).toBe(50);
    expect((await (await vehicles(request("vehicles?offset=50"))).json()).vehicles).toHaveLength(2);
  });
  it("révoque immédiatement l’ancien jeton lors d’une rotation", async () => {
    const old = token; token = (await (await issue(manage())).json()).token;
    expect(token).not.toBe(old); expect((await vehicles(request("vehicles", old))).status).toBe(401);
    expect((await vehicles(request("vehicles"))).status).toBe(200);
  });
  it("refuse un accès expiré puis révoqué", async () => {
    await state.db.user.update({ where: { id: "owner" }, data: { hubTokenExpiresAt: new Date(0) } });
    expect((await vehicles(request("vehicles"))).status).toBe(401);
    token = (await (await issue(manage())).json()).token;
    expect((await revoke(manage("DELETE"))).status).toBe(200); expect((await vehicles(request("vehicles"))).status).toBe(401);
  });
});
