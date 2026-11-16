import { afterAll, beforeAll, beforeEach, describe, expect, it, vi } from "vitest";
import { NextRequest } from "next/server";
import { testDatabase } from "@/test/database";

const state = vi.hoisted(() => ({ db: null as unknown as import("@/generated/prisma/client").PrismaClient, userId: "owner" as string | null }));
vi.mock("./db", () => ({ get db() { return state.db; } }));
vi.mock("./auth", () => ({ getCurrentUser: async () => state.userId ? { id: state.userId } : null }));
import { POST as create } from "@/app/api/maintenance/route";
import { PATCH as updateRecord, DELETE as deleteRecord } from "@/app/api/maintenance/records/[id]/route";
import { PATCH as updateSchedule, DELETE as deleteSchedule } from "@/app/api/maintenance/[id]/route";

let fixture: Awaited<ReturnType<typeof testDatabase>>;
const request = (body: object, method = "PATCH") => new NextRequest("http://localhost/api/maintenance", { method, headers: { "content-type": "application/json" }, body: JSON.stringify(body) });
const context = (id: string) => ({ params: Promise.resolve({ id }) });
const record = { vehicleId: "car", type: "VIDANGE", title: "Vidange", date: "2026-01-01", mileage: 1200, cost: 200, notes: "Initial" };
const schedule = { vehicleId: "car", type: "VIDANGE", title: "Vidange prévue", dueDate: "2027-01-01", dueMileage: 20000, cycleStartDate: "2026-01-01", cycleStartMileage: 1000, estimatedCost: 200, notes: "À vérifier" };
const addRecord = async () => (await (await create(request({ ...record, kind: "record" }, "POST"))).json()).record.id as string;
const addSchedule = async () => (await (await create(request({ ...schedule, kind: "schedule" }, "POST"))).json()).schedule.id as string;

beforeAll(async () => {
  fixture = await testDatabase(); state.db = fixture.client;
  await state.db.user.createMany({ data: [{ id: "owner", kyrosSubject: "owner" }, { id: "outsider", kyrosSubject: "outsider" }] });
  for (const [id, userId] of [["car", "owner"], ["other-car", "outsider"]]) await state.db.vehicle.create({ data: { id, userId, brand: "Test", model: "Car", trim: "V", year: 2023, purchaseDate: new Date("2026-01-01"), purchaseMileage: 1000 } });
});
beforeEach(() => { state.userId = "owner"; });
afterAll(async () => { await fixture?.close(); });

describe.sequential("correction et suppression des entretiens", () => {
  it("synchronise le montant, la date, le kilométrage et le titre de la dépense sans doublon", async () => {
    const id = await addRecord();
    const before = await state.db.expense.findUniqueOrThrow({ where: { maintenanceRecordId: id } });
    expect((await updateRecord(request({ ...record, title: "Révision corrigée", date: "2026-02-02", mileage: 1500, cost: 120 }), context(id))).status).toBe(200);
    const expense = await state.db.expense.findUniqueOrThrow({ where: { maintenanceRecordId: id } });
    expect(expense.id).toBe(before.id); expect(Number(expense.amount)).toBe(120);
    expect(expense).toMatchObject({ comment: "Révision corrigée", mileage: 1500, date: new Date("2026-02-02") });
    expect(Number((await state.db.maintenanceRecord.findUniqueOrThrow({ where: { id } })).cost)).toBe(120);
  });
  it("vide les champs facultatifs, retire le coût lié et le recrée une seule fois", async () => {
    const id = await addRecord();
    expect((await updateRecord(request({ ...record, cost: "", mileage: "", notes: "", vehicleId: "other-car" }), context(id))).status).toBe(200);
    expect(await state.db.maintenanceRecord.findUniqueOrThrow({ where: { id } })).toMatchObject({ vehicleId: "car", cost: null, mileage: null, notes: null });
    expect(await state.db.expense.count({ where: { maintenanceRecordId: id } })).toBe(0);
    for (let i = 0; i < 2; i++) expect((await updateRecord(request(record), context(id))).status).toBe(200);
    expect(await state.db.expense.count({ where: { maintenanceRecordId: id } })).toBe(1);
    expect((await updateRecord(request({ ...record, cost: 0 }), context(id))).status).toBe(200);
    expect(await state.db.expense.count({ where: { maintenanceRecordId: id } })).toBe(0);
  });
  it("supprime l’entretien et sa dépense tout en conservant les dépenses indépendantes", async () => {
    const id = await addRecord();
    const independent = await state.db.expense.create({ data: { vehicleId: "car", category: "ENTRETIEN", amount: 200, date: new Date(record.date) } });
    expect((await deleteRecord(request({}, "DELETE"), context(id))).status).toBe(200);
    expect(await state.db.maintenanceRecord.findUnique({ where: { id } })).toBeNull();
    expect(await state.db.expense.count({ where: { maintenanceRecordId: id } })).toBe(0);
    expect(await state.db.expense.findUnique({ where: { id: independent.id } })).not.toBeNull();
  });
  it("valide avant toute écriture et annule aussi la correction si la dépense échoue", async () => {
    const id = await addRecord(), before = await state.db.maintenanceRecord.findUniqueOrThrow({ where: { id } });
    expect((await updateRecord(request({ ...record, cost: -1 }), context(id))).status).toBe(400);
    await state.db.$executeRawUnsafe(`CREATE TRIGGER reject_expense BEFORE UPDATE ON Expense BEGIN SELECT RAISE(ABORT, 'test rollback'); END`);
    try { expect((await updateRecord(request({ ...record, title: "Ne pas conserver", cost: 99 }), context(id))).status).toBe(500); }
    finally { await state.db.$executeRawUnsafe("DROP TRIGGER reject_expense"); }
    expect(await state.db.maintenanceRecord.findUniqueOrThrow({ where: { id } })).toEqual(before);
  });
  it("corrige une échéance sans la réaliser et permet d’effacer ses champs facultatifs", async () => {
    const id = await addSchedule();
    expect((await updateSchedule(request({ ...schedule, action: "update", title: "Échéance corrigée", dueDate: "", cycleStartDate: "", cycleStartMileage: "", estimatedCost: "", notes: "", vehicleId: "other-car" }), context(id))).status).toBe(200);
    expect(await state.db.maintenanceSchedule.findUniqueOrThrow({ where: { id } })).toMatchObject({ title: "Échéance corrigée", vehicleId: "car", completedAt: null, dueDate: null, dueMileage: 20000, cycleStartDate: null, cycleStartMileage: null, estimatedCost: null, notes: null });
    expect((await updateSchedule(request({ ...schedule, action: "update", dueDate: "", dueMileage: "" }), context(id))).status).toBe(400);
    expect((await updateSchedule(request({ ...schedule, action: "update", cycleStartMileage: 30000 }), context(id))).status).toBe(400);
    expect((await deleteSchedule(request({}, "DELETE"), context(id))).status).toBe(200);
    expect(await state.db.maintenanceSchedule.findUnique({ where: { id } })).toBeNull();
  });
  it("préserve l’action existante marquer réalisé et refuse de modifier une échéance terminée", async () => {
    const id = await addSchedule();
    expect((await updateSchedule(request({}), context(id))).status).toBe(200);
    expect((await state.db.maintenanceSchedule.findUniqueOrThrow({ where: { id } })).completedAt).toBeInstanceOf(Date);
    expect((await updateSchedule(request({ ...schedule, action: "update" }), context(id))).status).toBe(409);
    expect((await updateSchedule(request({ action: "invalid" }), context(id))).status).toBe(400);
  });
  it("isole toutes les mutations par propriétaire et exige une session", async () => {
    const recordId = await addRecord(), scheduleId = await addSchedule();
    for (const [userId, expected] of [["outsider", 404], [null, 401]] as const) {
      state.userId = userId;
      expect((await updateRecord(request(record), context(recordId))).status).toBe(expected);
      expect((await deleteRecord(request({}, "DELETE"), context(recordId))).status).toBe(expected);
      expect((await updateSchedule(request({ ...schedule, action: "update" }), context(scheduleId))).status).toBe(expected);
      expect((await deleteSchedule(request({}, "DELETE"), context(scheduleId))).status).toBe(expected);
    }
    expect(await state.db.maintenanceRecord.findUnique({ where: { id: recordId } })).not.toBeNull();
    expect(await state.db.maintenanceSchedule.findUnique({ where: { id: scheduleId } })).not.toBeNull();
  });
});
