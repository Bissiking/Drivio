import { afterAll, beforeAll, beforeEach, describe, expect, it, vi } from "vitest";
import { NextRequest } from "next/server";
import { testDatabase } from "@/test/database";
const state = vi.hoisted(() => ({ db: null as unknown as import("@/generated/prisma/client").PrismaClient, userId: "owner" }));
vi.mock("@/lib/db", () => ({ get db() { return state.db; } }));
vi.mock("@/lib/auth", () => ({ getCurrentUser: async () => ({ id: state.userId }) }));
import { PATCH as editFuel } from "@/app/api/fuel/[id]/route";
import { PATCH as editMaintenance } from "@/app/api/maintenance/records/[id]/route";
import { POST as addExpense } from "@/app/api/expenses/route";
import { PATCH as editExpense } from "@/app/api/expenses/[id]/route";
import { POST as addMaintenance } from "@/app/api/maintenance/route";
import { PATCH as editSchedule } from "@/app/api/maintenance/[id]/route";
import { PATCH as editVehicle } from "@/app/api/vehicles/[id]/route";
import { POST as addRecord } from "@/app/api/vehicle-records/[kind]/route";
import { DELETE as revoke } from "@/app/api/vehicles/[id]/shares/[shareId]/route";
import { operatingCosts } from "./analytics";
import { expenseSchema } from "./validations";

let fixture: Awaited<ReturnType<typeof testDatabase>>;
const date = new Date("2026-02-01");
const request = (body: object, method = "PATCH") => new NextRequest("http://localhost/api", { method, headers: { "content-type": "application/json" }, body: JSON.stringify(body) });
const context = (id: string) => ({ params: Promise.resolve({ id }) });
const fuelBody = { date: "2026-02-02", mileage: 1200, liters: 15, totalPrice: 30, isFull: true };
const maintenanceBody = { date: "2026-02-02", mileage: 1200, type: "VIDANGE", title: "Vidange", cost: 120 };
async function legacy(kind: "fuel" | "maintenance", copies = 1) {
  if (kind === "fuel") await state.db.fuelEntry.create({ data: { id: "record", vehicleId: "car", date, mileage: 1100, liters: 10, totalPrice: 20, unitPrice: 2, isFull: true } });
  else await state.db.maintenanceRecord.create({ data: { id: "record", vehicleId: "car", date, mileage: 1100, type: "PLAQUETTES", category: "FREINAGE", subcategory: "PLAQUETTES", title: "Plaquettes", cost: 100 } });
  for (let i = 0; i < copies; i++) await state.db.expense.create({ data: { id: `mirror-${i}`, vehicleId: "car", date, mileage: 1100, category: kind === "fuel" ? "CARBURANT" : "ENTRETIEN", amount: kind === "fuel" ? 20 : 100, comment: "Historique" } });
}
async function snapshot() {
  return Promise.all([state.db.vehicle.findMany(), state.db.fuelEntry.findMany(), state.db.maintenanceRecord.findMany(), state.db.expense.findMany(), state.db.mileageReading.findMany()]);
}
beforeAll(async () => {
  fixture = await testDatabase(); state.db = fixture.client;
  await state.db.user.createMany({ data: ["owner", "guest", "other"].map(id => ({ id, kyrosSubject: id })) });
});
beforeEach(async () => {
  vi.restoreAllMocks(); state.userId = "owner";
  await state.db.vehicle.deleteMany();
  await state.db.vehicle.create({ data: { id: "car", userId: "owner", brand: "Test", model: "Car", trim: "T", year: 2024, purchaseDate: new Date("2026-01-01"), purchaseMileage: 1000 } });
});
afterAll(async () => { vi.restoreAllMocks(); await fixture?.close(); });

describe("dépenses historiques et classification", () => {
  it.each(["fuel", "maintenance"] as const)("réutilise la dépense historique %s sans doublon et de façon idempotente", async kind => {
    await legacy(kind);
    const mutate = kind === "fuel" ? editFuel : editMaintenance, body = kind === "fuel" ? fuelBody : maintenanceBody;
    for (let i = 0; i < 2; i++) expect((await mutate(request(body), context("record"))).status).toBe(200);
    const expenses = await state.db.expense.findMany();
    expect(expenses).toHaveLength(1);
    expect(expenses[0]).toMatchObject({ id: "mirror-0", date: new Date(body.date), mileage: 1200, ...(kind === "fuel" ? { fuelEntryId: "record" } : { maintenanceRecordId: "record", subcategory: "VIDANGE" }) });
    const costs = operatingCosts(expenses, await state.db.fuelEntry.findMany(), await state.db.maintenanceRecord.findMany(), []);
    expect(costs.reduce((sum, cost) => sum + Number(cost.amount), 0)).toBe(kind === "fuel" ? 30 : 120);
    expect(expenseSchema.safeParse(expenses[0]).success).toBe(true);
  });
  it.each(["fuel", "maintenance"] as const)("refuse plusieurs miroirs %s sans aucune mutation partielle", async kind => {
    await legacy(kind, 2); const before = await snapshot();
    const response = await (kind === "fuel" ? editFuel : editMaintenance)(request(kind === "fuel" ? fuelBody : maintenanceBody), context("record"));
    expect(response.status).toBe(409); expect((await response.json()).error).toContain("historiques");
    expect(await snapshot()).toEqual(before);
  });
  it("refuse un seul miroir pouvant appartenir à deux entretiens", async () => {
    await legacy("maintenance");
    await state.db.maintenanceRecord.create({ data: { id: "competing", vehicleId: "car", type: "DISQUES", title: "Disques", date, mileage: 1100, cost: 100 } });
    const before = await snapshot();
    expect((await editMaintenance(request(maintenanceBody), context("record"))).status).toBe(409);
    expect(await snapshot()).toEqual(before);
  });
  it("préserve les dépenses indépendantes ou d’un autre véhicule", async () => {
    await legacy("fuel", 0);
    await state.db.vehicle.create({ data: { id: "private", userId: "other", brand: "Test", model: "Other", trim: "T", year: 2024, purchaseDate: date, purchaseMileage: 1000 } });
    await state.db.expense.createMany({ data: [
      { id: "private-expense", vehicleId: "private", category: "CARBURANT", amount: 20, date, mileage: 1100 },
      { id: "different-amount", vehicleId: "car", category: "CARBURANT", amount: 5, date, mileage: 1100 },
      { id: "different-category", vehicleId: "car", category: "PARKING", amount: 20, date, mileage: 1100 },
    ] });
    const before = await state.db.expense.findMany();
    expect((await editFuel(request(fuelBody), context("record"))).status).toBe(200);
    for (const expense of before) expect(await state.db.expense.findUniqueOrThrow({ where: { id: expense.id } })).toEqual(expense);
    expect(await state.db.expense.count()).toBe(4);
  });
  it("privilégie la liaison explicite et actualise le sous-type lors du changement d’entretien", async () => {
    await legacy("maintenance", 2);
    await state.db.expense.update({ where: { id: "mirror-0" }, data: { maintenanceRecordId: "record", subcategory: "FREINAGE" } });
    const independent = await state.db.expense.findUniqueOrThrow({ where: { id: "mirror-1" } });
    expect((await editMaintenance(request(maintenanceBody), context("record"))).status).toBe(200);
    expect((await state.db.expense.findUniqueOrThrow({ where: { id: "mirror-0" } })).subcategory).toBe("VIDANGE");
    expect(await state.db.expense.findUniqueOrThrow({ where: { id: "mirror-1" } })).toEqual(independent);
    expect((await editMaintenance(request({ ...maintenanceBody, type: "PERSONNALISE" }), context("record"))).status).toBe(200);
    expect((await state.db.expense.findUniqueOrThrow({ where: { id: "mirror-0" } })).subcategory).toBeNull();
  });
  it.each(["fuel", "maintenance"] as const)("relit une liaison %s ajoutée pendant une édition de dépense", async kind => {
    await legacy(kind);
    await state.db.vehicleShare.create({ data: { vehicleId: "car", email: "guest@example.test", recipientId: "guest", scope: "SIMPLE", permission: "WRITE", acceptedAt: date, expiresAt: new Date("2099-01-01") } });
    let entered!: () => void, resume!: () => void;
    const ready = new Promise<void>(resolve => { entered = resolve; });
    const gate = new Promise<void>(resolve => { resume = resolve; });
    const body = { category: kind === "fuel" ? "CARBURANT" : "ENTRETIEN", amount: 999, date: "2026-02-01" };
    const editingRequest = request(body);
    vi.spyOn(editingRequest, "json").mockImplementationOnce(async () => { entered(); await gate; return body; });
    state.userId = "guest";
    const editing = editExpense(editingRequest, context("mirror-0")); await ready;
    try {
      state.userId = "owner";
      const updated = await (kind === "fuel" ? editFuel : editMaintenance)(request(kind === "fuel" ? fuelBody : maintenanceBody), context("record"));
      expect(updated.status).toBe(200);
    } finally { resume(); }
    expect((await editing).status).toBe(kind === "fuel" ? 409 : 403);
    expect(Number((await state.db.expense.findUniqueOrThrow({ where: { id: "mirror-0" } })).amount)).toBe(kind === "fuel" ? 30 : 120);
  });
});

describe("révocation entre le premier contrôle et l’écriture", () => {
  const actions = [
    { name: "dépense", run: () => addExpense(request({ vehicleId: "car", category: "PARKING", amount: 10, date: "2026-02-01" }, "POST")) },
    { name: "entretien", run: () => addMaintenance(request({ ...maintenanceBody, vehicleId: "car", kind: "record" }, "POST")) },
    { name: "création d’échéance", run: () => addMaintenance(request({ vehicleId: "car", kind: "schedule", type: "VIDANGE", title: "Vidange", dueMileage: 9000 }, "POST")) },
    { name: "modification d’échéance", run: () => editSchedule(request({ action: "update", type: "VIDANGE", title: "Corrigé", dueMileage: 9500 }), context("schedule")) },
    { name: "transmission", run: () => editVehicle(request({ action: "drivetrain", drivetrain: "AWD" }), context("car")) },
    { name: "garantie", run: () => addRecord(request({ vehicleId: "car", title: "Garantie", type: "AUTRE", startDate: "2026-01-01", endDate: "2027-01-01" }, "POST"), { params: Promise.resolve({ kind: "warranty" }) }) },
  ];
  it.each(actions)("refuse $name lorsque la révocation gagne le verrou", async ({ run }) => {
    await state.db.vehicleShare.create({ data: { id: "share", vehicleId: "car", email: "guest@example.test", recipientId: "guest", scope: "COMPLETE", permission: "WRITE", acceptedAt: date, expiresAt: new Date("2099-01-01") } });
    await state.db.maintenanceSchedule.create({ data: { id: "schedule", vehicleId: "car", type: "VIDANGE", title: "Initial", dueMileage: 9000 } });
    const before = await state.db.vehicle.findUniqueOrThrow({ where: { id: "car" } });
    const lookup = state.db.vehicle.findFirst.bind(state.db.vehicle);
    let entered!: () => void, resume!: () => void;
    const paused = new Promise<void>(resolve => { entered = resolve; });
    const gate = new Promise<void>(resolve => { resume = resolve; });
    // Pause a real initial lookup after reading its result, outside any transaction.
    // The owner can complete revocation before this request attempts to write.
    const spy = vi.spyOn(state.db.vehicle, "findFirst").mockImplementationOnce(args => {
      const query = lookup(args);
      const delayed = query.then(async result => { entered(); await gate; return result; });
      return new Proxy(query, { get(target, property, receiver) {
        return property === "then" ? delayed.then.bind(delayed) : Reflect.get(target, property, receiver);
      } });
    });
    state.userId = "guest";
    const pending = run(); await paused;
    try {
      state.userId = "owner";
      const revoked = await revoke(request({}, "DELETE"), { params: Promise.resolve({ id: "car", shareId: "share" }) });
      expect(revoked.status).toBe(200);
    } finally { resume(); }
    expect((await pending).status).toBe(404); spy.mockRestore();
    expect(await state.db.expense.count()).toBe(0);
    expect(await state.db.maintenanceRecord.count()).toBe(0);
    expect(await state.db.warranty.count()).toBe(0);
    expect(await state.db.maintenanceSchedule.findUniqueOrThrow({ where: { id: "schedule" } })).toMatchObject({ title: "Initial", dueMileage: 9000 });
    expect((await state.db.vehicle.findUniqueOrThrow({ where: { id: "car" } })).drivetrain).toBe(before.drivetrain);
  });
});
