import { afterAll, beforeAll, beforeEach, describe, expect, it, vi } from "vitest";
import { NextRequest } from "next/server";
import { testDatabase } from "@/test/database";
const state = vi.hoisted(() => ({ db: null as unknown as import("@/generated/prisma/client").PrismaClient, userId: "owner" as string | null }));
vi.mock("./db", () => ({ get db() { return state.db; } }));
vi.mock("./auth", () => ({ getCurrentUser: async () => state.userId ? state.db.user.findUnique({ where: { id: state.userId } }) : null }));
import { persistRecord } from "./vehicle-records";
import { tireSchema, drivetrainSchema } from "./validations";
import { POST } from "@/app/api/vehicle-records/[kind]/route";
import { PATCH } from "@/app/api/vehicle-records/[kind]/[id]/route";
let fixture: Awaited<ReturnType<typeof testDatabase>>;
const montage = (overrides: object = {}) => ({ vehicleId: "car", brand: "Test", dimensions: "205/55 R16", type: "ETE", quality: "STANDARD", position: "COMPLET", mountedAt: "2025-01-01", mountedMileage: 10000, ...overrides });
const request = (body: object, method = "POST") => new NextRequest("http://localhost/api/vehicle-records/tires", { method, headers: { "content-type": "application/json" }, body: JSON.stringify(body) });
beforeAll(async () => {
  fixture = await testDatabase(); state.db = fixture.client;
  await state.db.user.createMany({ data: [{ id: "owner", kyrosSubject: "owner" }, { id: "outsider", kyrosSubject: "outsider" }] });
  for (const [id, userId] of [["car", "owner"], ["other", "outsider"]]) await state.db.vehicle.create({ data: { id, userId, brand: "Test", model: "Car", trim: "V", year: 2022, purchaseDate: new Date("2024-01-01"), purchaseMileage: 0 } });
});
afterAll(async () => { await fixture.close(); });
beforeEach(async () => { state.userId = "owner"; await state.db.tireSet.deleteMany(); });
describe.sequential("montages de pneus par essieu", () => {
  it("valide la gamme et la transmission et laisse l'estimation automatique vide", async () => {
    expect(tireSchema.parse(montage()).estimatedLifeKm).toBeNull();
    expect(tireSchema.parse(montage({ estimatedLifeKm: "" })).estimatedLifeKm).toBeNull();
    expect(tireSchema.parse(montage({ estimatedLifeKm: 40000 })).estimatedLifeKm).toBe(40000);
    expect(tireSchema.safeParse(montage({ quality: "LUXURY" })).success).toBe(false);
    expect(tireSchema.safeParse(montage({ mountedAt: "2099-01-01" })).success).toBe(false);
    expect(tireSchema.safeParse(montage({ removedAt: "2099-01-01", removedMileage: 20000 })).success).toBe(false);
    expect(drivetrainSchema.safeParse("REAR").success).toBe(true);
    expect(drivetrainSchema.safeParse("propulsion").success).toBe(false);
    const record = await persistRecord("tires", montage());
    expect(record).toMatchObject({ position: "COMPLET", quality: "STANDARD", estimatedLifeKm: null });
    expect((await state.db.vehicle.findUniqueOrThrow({ where: { id: "car" } })).drivetrain).toBe("UNKNOWN");
  });
  it("remplace l'avant et conserve l'arrière avec son montage, ses mesures et la moitié du budget", async () => {
    const original = await persistRecord("tires", montage({ estimatedLifeKm: 50000, quality: "PREMIUM", notes: "Montage initial" }));
    await state.db.tireSet.update({ where: { id: original.id }, data: { replacementCost: 600, targetDepthMm: 2 } });
    await state.db.tireMeasurement.create({ data: { tireSetId: original.id, date: new Date("2025-02-01"), mileage: 12000, treadDepthMm: 6 } });
    const front = await persistRecord("tires", montage({ position: "AVANT", brand: "Nouveaux", mountedAt: "2025-06-01", mountedMileage: 20000 }));
    const old = await state.db.tireSet.findUniqueOrThrow({ where: { id: original.id }, include: { measurements: true } });
    expect(old).toMatchObject({ position: "AVANT", removedMileage: 20000, mountedMileage: 10000 });
    expect(old.removedAt).toEqual(new Date("2025-06-01")); expect(Number(old.replacementCost)).toBe(300); expect(old.measurements).toHaveLength(1);
    const rear = await state.db.tireSet.findFirstOrThrow({ where: { vehicleId: "car", position: "ARRIERE", removedAt: null }, include: { measurements: true } });
    expect(rear).toMatchObject({ mountedMileage: 10000, mountedAt: new Date("2025-01-01"), estimatedLifeKm: 50000, quality: "PREMIUM", notes: "Montage initial" });
    expect(rear.measurements).toHaveLength(1); expect(rear.measurements[0].mileage).toBe(12000); expect(Number(rear.targetDepthMm)).toBe(2); expect(Number(rear.replacementCost)).toBe(300);
    expect(await state.db.tireSet.count({ where: { removedAt: null } })).toBe(2);
    expect(front).toMatchObject({ position: "AVANT", mountedMileage: 20000, removedAt: null });
  });
  it("remplace seulement l'arrière sans clôturer l'avant, puis les quatre sans doublon actif", async () => {
    const front = await persistRecord("tires", montage({ position: "AVANT" }));
    const rear = await persistRecord("tires", montage({ position: "ARRIERE" }));
    await persistRecord("tires", montage({ position: "ARRIERE", mountedAt: "2025-06-01", mountedMileage: 20000 }));
    expect((await state.db.tireSet.findUniqueOrThrow({ where: { id: front.id } })).removedAt).toBeNull();
    expect((await state.db.tireSet.findUniqueOrThrow({ where: { id: rear.id } })).removedMileage).toBe(20000);
    const complete = await persistRecord("tires", montage({ mountedAt: "2025-10-01", mountedMileage: 30000 }));
    expect(await state.db.tireSet.count({ where: { removedAt: null } })).toBe(1);
    expect(await state.db.tireSet.findFirst({ where: { removedAt: null } })).toMatchObject({ id: complete.id, position: "COMPLET" });
    expect(await state.db.tireSet.count()).toBe(4);
  });
  it("refuse les remplacements antidatés ou avant une mesure sans mutation partielle", async () => {
    const original = await persistRecord("tires", montage());
    await state.db.tireMeasurement.create({ data: { tireSetId: original.id, date: new Date("2025-04-01"), mileage: 15000, treadDepthMm: 5 } });
    for (const bad of [{ mountedAt: "2024-12-01", mountedMileage: 20000 }, { mountedAt: "2025-06-01", mountedMileage: 9000 }, { mountedAt: "2025-03-01", mountedMileage: 20000 }, { mountedAt: "2025-06-01", mountedMileage: 14000 }]) await expect(persistRecord("tires", montage({ ...bad, position: "AVANT" }))).rejects.toThrow();
    expect(await state.db.tireSet.count()).toBe(1);
    expect((await state.db.tireSet.findUniqueOrThrow({ where: { id: original.id } })).removedAt).toBeNull();
  });
  it("refuse les chevauchements créés par une modification et garde les historiques cohérents", async () => {
    const front = await persistRecord("tires", montage({ position: "AVANT" }));
    await persistRecord("tires", montage({ position: "ARRIERE" }));
    await expect(persistRecord("tires", montage(), front.id)).rejects.toThrow(/essieu/);
    await persistRecord("tires", montage({ position: "AVANT", mountedAt: "2025-06-01", mountedMileage: 20000 }));
    await expect(persistRecord("tires", montage({ position: "AVANT", mountedAt: "2025-03-01", mountedMileage: 15000, removedAt: "2025-08-01", removedMileage: 25000 }))).rejects.toThrow(/essieu/);
    await expect(persistRecord("tires", montage({ position: "AVANT", mountedAt: "2025-08-01", mountedMileage: 19000 }))).rejects.toThrow(/compteur/);
    expect(await state.db.tireSet.count()).toBe(3);
  });
  it("protège les API par propriétaire et ne permet pas de transférer un montage", async () => {
    const context = { params: Promise.resolve({ kind: "tires" }) };
    state.userId = null; expect((await POST(request(montage()), context)).status).toBe(401);
    state.userId = "owner"; expect((await POST(request(montage({ vehicleId: "other" })), context)).status).toBe(404);
    const original = await persistRecord("tires", montage());
    const itemContext = { params: Promise.resolve({ kind: "tires", id: original.id }) };
    state.userId = "outsider"; expect((await PATCH(request(montage(), "PATCH"), itemContext)).status).toBe(404);
    state.userId = "owner";
    expect((await PATCH(request(montage({ vehicleId: "other" }), "PATCH"), itemContext)).status).toBe(200);
    expect((await state.db.tireSet.findUniqueOrThrow({ where: { id: original.id } })).vehicleId).toBe("car");
  });
});
