import { afterAll, beforeAll, describe, expect, it, vi } from "vitest";
import { NextRequest } from "next/server";
import { testDatabase } from "@/test/database";
const state = vi.hoisted(() => ({ db: null as unknown as import("@/generated/prisma/client").PrismaClient, userId: "owner" as string | null }));
vi.mock("@/lib/db", () => ({ get db() { return state.db; } }));
vi.mock("@/lib/auth", () => ({ getCurrentUser: async () => state.userId ? { id: state.userId } : null }));
import { POST as addFuel } from "@/app/api/fuel/route";
import { PATCH as editFuel } from "@/app/api/fuel/[id]/route";
import { POST as addExpense } from "@/app/api/expenses/route";
import { PATCH as editExpense } from "@/app/api/expenses/[id]/route";
import { POST as addMaintenance } from "@/app/api/maintenance/route";
import { PATCH as editMaintenance } from "@/app/api/maintenance/records/[id]/route";
import { PATCH as theme } from "@/app/api/preferences/theme/route";
let fixture: Awaited<ReturnType<typeof testDatabase>>, first: string, middle: string, last: string;
const request = (body: object, method = "PATCH") => new NextRequest("http://localhost/api", { method, headers: { "content-type": "application/json" }, body: JSON.stringify(body) });
const context = (id: string) => ({ params: Promise.resolve({ id }) });
const data = { vehicleId: "car", date: "2026-02-01", mileage: 1100, liters: 10, totalPrice: 20, isFull: true };
beforeAll(async () => {
  fixture = await testDatabase(); state.db = fixture.client;
  await state.db.user.createMany({ data: [{ id: "owner", kyrosSubject: "owner" }, { id: "outsider", kyrosSubject: "outsider" }] });
  await state.db.vehicle.create({ data: { id: "car", userId: "owner", brand: "Test", model: "Car", trim: "V", year: 2024, purchaseDate: new Date("2026-01-01"), purchaseMileage: 1000 } });
  const ids: string[] = [];
  for (const [date, mileage] of [["2026-02-01", 1100], ["2026-02-10", 1200], ["2026-02-20", 1300]] as const) {
    const response = await addFuel(request({ ...data, date, mileage }, "POST")); expect(response.status).toBe(201); ids.push((await response.json()).fuel.id);
  }
  [first, middle, last] = ids;
});
afterAll(async () => fixture?.close());
describe.sequential("édition 2.1.0", () => {
  it("corrige un plein en place, son relevé, sa dépense et les intervalles suivants", async () => {
    const original = await state.db.fuelEntry.findUniqueOrThrow({ where: { id: middle }, include: { expense: true } });
    const response = await editFuel(request({ ...data, date: "2026-02-11", mileage: 1250, liters: 15, totalPrice: 30 }), context(middle));
    expect(response.status).toBe(200);
    const edited = await state.db.fuelEntry.findUniqueOrThrow({ where: { id: middle }, include: { expense: true, mileageReading: true } });
    expect(edited.mileageReadingId).toBe(original.mileageReadingId); expect(edited.expense?.id).toBe(original.expense?.id);
    expect(edited.mileageReading?.mileage).toBe(1250); expect(Number(edited.expense?.amount)).toBe(30);
    expect(Number(edited.consumptionPer100Km)).toBe(10); expect(Number((await state.db.fuelEntry.findUniqueOrThrow({ where: { id: last } })).consumptionPer100Km)).toBe(20);
    expect(await state.db.expense.count()).toBe(3); expect(await state.db.fuelEntry.count()).toBe(3);
  });
  it("préserve un relevé manuel partagé, et ne change jamais le véhicule via le corps", async () => {
    const original = await state.db.fuelEntry.findUniqueOrThrow({ where: { id: middle } });
    await state.db.mileageReading.update({ where: { id: original.mileageReadingId! }, data: { source: "MANUAL", comment: "Observation indépendante" } });
    expect((await editFuel(request({ ...data, vehicleId: "forged", date: "2026-02-12", mileage: 1260, liters: 15, totalPrice: 30 }), context(middle))).status).toBe(200);
    const edited = await state.db.fuelEntry.findUniqueOrThrow({ where: { id: middle } }); expect(edited.vehicleId).toBe("car");
    expect(edited.mileageReadingId).not.toBe(original.mileageReadingId);
    const manual = await state.db.mileageReading.findUniqueOrThrow({ where: { id: original.mileageReadingId! } }); expect(manual.mileage).toBe(1250); expect(manual.comment).toBe("Observation indépendante");
  });
  it("annule entièrement une modification incohérente et rejette les prix incompatibles", async () => {
    const before = await state.db.fuelEntry.findUniqueOrThrow({ where: { id: first }, include: { expense: true, mileageReading: true } });
    expect((await editFuel(request({ ...data, mileage: 9999 }), context(first))).status).toBe(409);
    expect(await state.db.fuelEntry.findUniqueOrThrow({ where: { id: first }, include: { expense: true, mileageReading: true } })).toEqual(before);
    expect((await editFuel(request({ ...data, unitPrice: 12 }), context(first))).status).toBe(400);
    expect((await editFuel(request({ ...data, unitPrice: 0 }), context(first))).status).toBe(400);
  });
  it("refuse les modifications anonymes ou appartenant à un autre compte", async () => {
    state.userId = "outsider"; expect((await editFuel(request(data), context(first))).status).toBe(404);
    const expense = await state.db.expense.findFirstOrThrow(); expect((await editExpense(request({}), context(expense.id))).status).toBe(404);
    state.userId = null; expect((await editFuel(request(data), context(first))).status).toBe(401); expect((await editExpense(request({}), context(expense.id))).status).toBe(401); state.userId = "owner";
  });
  it("oriente une dépense de carburant liée vers l’édition du plein", async () => {
    const expense = await state.db.expense.findFirstOrThrow({ where: { fuelEntryId: first } });
    expect((await editExpense(request({ amount: 999 }), context(expense.id))).status).toBe(409);
  });
  it("modifie une dépense simple sans doublon et valide son sous-type", async () => {
    const response = await addExpense(request({ vehicleId: "car", category: "PARKING", amount: 10, date: "2026-02-01" }, "POST"));
    const expense = (await response.json()).expense;
    expect((await editExpense(request({ category: "PARKING", subcategory: "ABONNEMENT", amount: 15, date: "2026-02-02", comment: "Corrigé", mileage: "" }), context(expense.id))).status).toBe(200);
    const saved = await state.db.expense.findUniqueOrThrow({ where: { id: expense.id } }); expect(Number(saved.amount)).toBe(15); expect(saved.subcategory).toBe("ABONNEMENT"); expect(saved.mileage).toBeNull();
    expect((await editExpense(request({ category: "PARKING", subcategory: "VIDANGE", amount: 15, date: "2026-02-02" }), context(expense.id))).status).toBe(400);
  });
  it("synchronise dans les deux sens un entretien et sa dépense, en conservant la classification", async () => {
    const response = await addMaintenance(request({ kind: "record", vehicleId: "car", type: "PLAQUETTES", title: "Plaquettes avant", cost: 100, mileage: 1200, date: "2026-02-10" }, "POST")); expect(response.status).toBe(201);
    const record = (await response.json()).record; expect(record.category).toBe("FREINAGE"); expect(record.subcategory).toBe("PLAQUETTES");
    const expense = await state.db.expense.findUniqueOrThrow({ where: { maintenanceRecordId: record.id } });
    expect((await editExpense(request({ category: "ENTRETIEN", subcategory: "FREINAGE", amount: 125, date: "2026-02-11", mileage: 1250 }), context(expense.id))).status).toBe(200);
    const updated = await state.db.maintenanceRecord.findUniqueOrThrow({ where: { id: record.id } }); expect(Number(updated.cost)).toBe(125); expect(updated.mileage).toBe(1250); expect(updated.title).toBe("Plaquettes avant");
    expect((await editExpense(request({ category: "AUTRE", amount: 125, date: "2026-02-11" }), context(expense.id))).status).toBe(409);
    expect((await editMaintenance(request({ ...record, type: "DISQUES", cost: 160, date: "2026-02-12" }), context(record.id))).status).toBe(200);
    expect(Number((await state.db.expense.findUniqueOrThrow({ where: { id: expense.id } })).amount)).toBe(160);
  });
  it("enregistre les thèmes par compte avec cookie utilisable dès le rendu serveur", async () => {
    const response = await theme(request({ mode: "auto", palette: "slate" })); expect(response.status).toBe(200);
    expect(response.headers.get("set-cookie")).toContain("drivio_theme=auto%3Aslate");
    expect((await state.db.user.findUniqueOrThrow({ where: { id: "owner" } })).themeMode).toBe("auto");
    expect((await state.db.user.findUniqueOrThrow({ where: { id: "outsider" } })).themeMode).toBe("dark");
    expect((await theme(request({ mode: "invalid", palette: "slate" }))).status).toBe(400);
    state.userId = null; expect((await theme(request({ mode: "dark", palette: "copper" }))).status).toBe(401); state.userId = "owner";
  });
});
