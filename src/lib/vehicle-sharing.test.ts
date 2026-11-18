import { afterAll, beforeAll, describe, expect, it, vi } from "vitest";
import { NextRequest } from "next/server";
import { writeFile, mkdir } from "node:fs/promises";
import { testDatabase } from "@/test/database";
const state = vi.hoisted(() => ({ db: null as unknown as import("@/generated/prisma/client").PrismaClient, userId: "owner" as string | null }));
vi.mock("@/lib/db", () => ({ get db() { return state.db; } }));
vi.mock("@/lib/auth", () => ({ getCurrentUser: async () => state.userId ? state.db.user.findUnique({ where: { id: state.userId } }) : null }));
import { POST as invite } from "@/app/api/vehicles/[id]/shares/route";
import { PATCH as rights, DELETE as revoke } from "@/app/api/vehicles/[id]/shares/[shareId]/route";
import { POST as accept, DELETE as leave } from "@/app/api/shares/[id]/route";
import { POST as addFuel } from "@/app/api/fuel/route";
import { PATCH as editFuel } from "@/app/api/fuel/[id]/route";
import { POST as addExpense } from "@/app/api/expenses/route";
import { PATCH as editExpense } from "@/app/api/expenses/[id]/route";
import { POST as addMileage } from "@/app/api/mileage/route";
import { PATCH as editMileage } from "@/app/api/mileage/[id]/route";
import { POST as addMaintenance } from "@/app/api/maintenance/route";
import { PATCH as editSchedule, DELETE as deleteSchedule } from "@/app/api/maintenance/[id]/route";
import { POST as addRecord } from "@/app/api/vehicle-records/[kind]/route";
import { PATCH as editVehicle } from "@/app/api/vehicles/[id]/route";
import { GET as document, DELETE as deleteDocument } from "@/app/api/documents/[id]/route";
import { POST as report } from "@/app/api/reports/route";
import { GET as hubVehicles } from "@/app/api/hub/v1/vehicles/route";
import { GET as hubSummary } from "@/app/api/hub/v1/summary/route";
import { requireVehicleAccess, vehicleWhere } from "./vehicle-access";
import { vehicleWorkspace } from "./vehicle-workspace";
import { newHubToken } from "./hub";
import { sendNotifications } from "./gotify";
let fixture: Awaited<ReturnType<typeof testDatabase>>, fuelId: string, expenseId: string, mileageId: string;
const actors = [["simple-read", "SIMPLE", "READ"], ["simple-write", "SIMPLE", "WRITE"], ["complete-read", "COMPLETE", "READ"], ["complete-write", "COMPLETE", "WRITE"]] as const;
const req = (data: object = {}, method = "POST") => new NextRequest("http://localhost/api", { method, headers: { "content-type": "application/json" }, ...(method === "GET" ? {} : { body: JSON.stringify(data) }) });
const ctx = (id: string) => ({ params: Promise.resolve({ id }) });
const shareContext = (shareId: string, id = "car") => ({ params: Promise.resolve({ id, shareId }) });
const fuelData = { vehicleId: "car", date: "2026-02-01", mileage: 1100, liters: 10, totalPrice: 20, isFull: true };
beforeAll(async () => {
  fixture = await testDatabase(); state.db = fixture.client;
  await state.db.user.createMany({ data: ["owner", "outsider", "expired", ...actors.map(([id]) => id)].map(id => ({ id, kyrosSubject: id, email: `${id}@example.test` })) });
  await state.db.vehicle.createMany({ data: ["car", "private"].map(id => ({ id, userId: "owner", brand: "Test", model: id, trim: "V", year: 2024, purchaseDate: new Date("2026-01-01"), purchaseMileage: 1000 })) });
  const addedFuel = await addFuel(req(fuelData)); fuelId = (await addedFuel.json()).fuel.id;
  const addedExpense = await addExpense(req({ vehicleId: "car", date: "2026-02-01", amount: 10, category: "PARKING" })); expenseId = (await addedExpense.json()).expense.id;
  mileageId = (await state.db.fuelEntry.findUniqueOrThrow({ where: { id: fuelId } })).mileageReadingId!;
  await state.db.maintenanceRecord.create({ data: { id: "maintenance", vehicleId: "car", type: "VIDANGE", title: "Vidange", date: new Date("2026-02-01"), cost: 50, notes: "PRIVATE_MAINTENANCE_NOTE" } });
  await state.db.expense.create({ data: { id: "linked-maintenance", vehicleId: "car", category: "ENTRETIEN", maintenanceRecordId: "maintenance", amount: 50, date: new Date("2026-02-01") } });
  await state.db.maintenanceSchedule.create({ data: { id: "schedule", vehicleId: "car", type: "VIDANGE", title: "Vidange prévue", dueMileage: 9000 } });
  await mkdir(`${fixture.directory}/documents`); await writeFile(`${fixture.directory}/documents/proof.pdf`, "%PDF-test");
  vi.stubEnv("DRIVIO_DOCUMENT_DIR", `${fixture.directory}/documents`);
  await state.db.vehicleDocument.create({ data: { id: "document", vehicleId: "car", title: "Justificatif privé", category: "AUTRE", date: new Date("2026-02-01"), storageKey: "proof.pdf", originalName: "proof.pdf", mimeType: "application/pdf", size: 9 } });
});
afterAll(async () => { vi.unstubAllEnvs(); await fixture?.close(); });
describe.sequential("partage de véhicule", () => {
  it("invite sans dupliquer le véhicule ni attribuer d’accès avant acceptation", async () => {
    for (const [id, scope, permission] of actors) {
      state.userId = "owner"; expect((await invite(req({ email: `${id.toUpperCase()}@EXAMPLE.TEST`, scope, permission }), ctx("car"))).status).toBe(201);
      expect(await state.db.vehicle.findMany({ where: vehicleWhere(id) })).toHaveLength(0);
      const share = await state.db.vehicleShare.findUniqueOrThrow({ where: { vehicleId_email: { vehicleId: "car", email: `${id}@example.test` } } });
      state.userId = "outsider"; expect((await accept(req(), ctx(share.id))).status).toBe(404);
      state.userId = id; expect((await accept(req(), ctx(share.id))).status).toBe(200);
    }
    expect(await state.db.vehicle.count()).toBe(2); expect((await state.db.vehicle.findUniqueOrThrow({ where: { id: "car" } })).userId).toBe("owner");
  });
  it.each(actors)("applique la matrice de lecture %s", async (id, scope, permission) => {
    state.userId = id;
    expect((await requireVehicleAccess(id, "car")).canWrite).toBe(permission === "WRITE");
    expect((await vehicleWorkspace(id, "car", "SIMPLE")).vehicle?.id).toBe("car");
    expect(Boolean((await vehicleWorkspace(id, "car")).vehicle)).toBe(scope === "COMPLETE");
    await expect(requireVehicleAccess(id, "private")).rejects.toMatchObject({ status: 404 });
    if (scope === "COMPLETE") expect((await requireVehicleAccess(id, "car", "COMPLETE")).scope).toBe(scope);
    else await expect(requireVehicleAccess(id, "car", "COMPLETE")).rejects.toMatchObject({ status: 403 });
    const response = await document(req({}, "GET"), ctx("document")); expect(response.status).toBe(scope === "COMPLETE" ? 200 : 404);
    const exported = await report(req({ vehicleId: "car", template: "summary", from: "2026-01-01", to: "2026-12-31", sections: ["mileage"] })); expect(exported.status).toBe(scope === "COMPLETE" ? 200 : 404);
  });
  it.each(actors)("protège carburant, dépenses et kilomètres pour %s", async (id, _scope, permission) => {
    state.userId = id; const expected = permission === "WRITE" ? 200 : 403;
    expect((await editFuel(req({ ...fuelData, vehicleId: "private", liters: 12, totalPrice: 24 }, "PATCH"), ctx(fuelId))).status).toBe(expected);
    expect((await editExpense(req({ category: "PARKING", amount: 15, date: "2026-02-01", vehicleId: "private" }, "PATCH"), ctx(expenseId))).status).toBe(expected);
    expect((await editMileage(req({ date: "2026-02-01", mileage: 1100 }, "PATCH"), ctx(mileageId))).status).toBe(expected);
    expect((await addExpense(req({ vehicleId: "car", category: "AUTRE", amount: 2, date: "2026-02-01" }))).status).toBe(permission === "WRITE" ? 201 : 403);
    expect((await addMileage(req({ vehicleId: "car", mileage: 1100, date: "2026-02-01" }))).status).toBe(permission === "WRITE" ? 201 : 403);
    expect((await state.db.expense.findUniqueOrThrow({ where: { id: expenseId } })).vehicleId).toBe("car");
  });
  it.each(actors)("protège les ressources complètes et les écritures liées pour %s", async (id, scope, permission) => {
    state.userId = id; const writable = scope === "COMPLETE" && permission === "WRITE";
    expect((await addMaintenance(req({ kind: "record", vehicleId: "car", type: "BOUGIES", title: "Bougies", date: "2026-02-01", cost: 10 }))).status).toBe(writable ? 201 : 403);
    expect((await editSchedule(req({ action: "update", type: "VIDANGE", title: "Échéance corrigée", dueMileage: 9000 }, "PATCH"), ctx("schedule"))).status).toBe(writable ? 200 : 403);
    expect((await editExpense(req({ category: "ENTRETIEN", amount: 60, date: "2026-02-01" }, "PATCH"), ctx("linked-maintenance"))).status).toBe(writable ? 200 : 403);
    expect((await editVehicle(req({ action: "drivetrain", drivetrain: "AWD" }, "PATCH"), ctx("car"))).status).toBe(writable ? 200 : 403);
    const warranty = await addRecord(req({ vehicleId: "car", title: "Garantie", type: "AUTRE", startDate: "2026-01-01", endDate: "2027-01-01" }), { params: Promise.resolve({ kind: "warranty" }) }); expect(warranty.status).toBe(writable ? 201 : 403);
  });
  it("réserve les partages et le véhicule principal au propriétaire", async () => {
    state.userId = "complete-write";
    expect((await invite(req({ email: "outsider@example.test", scope: "COMPLETE", permission: "WRITE" }), ctx("car"))).status).toBe(404);
    expect((await editVehicle(req({ action: "primary" }, "PATCH"), ctx("car"))).status).toBe(403);
    const share = await state.db.vehicleShare.findFirstOrThrow();
    expect((await rights(req({ scope: "COMPLETE", permission: "WRITE" }, "PATCH"), shareContext(share.id))).status).toBe(404);
    expect((await revoke(req({}, "DELETE"), shareContext(share.id))).status).toBe(404);
  });
  it("ne retransmet pas les véhicules reçus dans l’API Hub", async () => {
    const key = newHubToken(); await state.db.user.update({ where: { id: "complete-write" }, data: { hubTokenHash: key.hash, hubTokenExpiresAt: key.expiresAt } });
    const headers = { authorization: `Bearer ${key.token}` };
    expect((await (await hubVehicles(new Request("http://localhost/api/hub/v1/vehicles", { headers }))).json()).vehicles).toEqual([]);
    expect((await hubSummary(new Request("http://localhost/api/hub/v1/summary?vehicle=car", { headers }))).status).toBe(404);
  });
  it("inclut les alertes partagées seulement dans le périmètre complet, sans envoi réel", async () => {
    await state.db.maintenanceSchedule.update({ where: { id: "schedule" }, data: { dueMileage: 1000 } });
    for (const userId of ["simple-read", "complete-read"]) await state.db.notificationSettings.create({ data: { userId, enabled: true, tokenEncrypted: "synthetic-unused-in-dry-run" } });
    expect((await sendNotifications("simple-read", true)).skipped).toBe(0);
    expect((await sendNotifications("complete-read", true)).skipped).toBeGreaterThan(0);
    await state.db.maintenanceSchedule.update({ where: { id: "schedule" }, data: { dueMileage: 9000 } });
  });
  it("contrôle les invitations expirées, les auto-invitations et les valeurs invalides", async () => {
    state.userId = "owner";
    expect((await invite(req({ email: "owner@example.test", scope: "SIMPLE", permission: "READ" }), ctx("car"))).status).toBe(400);
    expect((await invite(req({ email: "expired@example.test", scope: "UNKNOWN", permission: "WRITE" }), ctx("car"))).status).toBe(400);
    expect((await invite(req({ email: "expired@example.test", scope: "SIMPLE", permission: "READ" }), ctx("car"))).status).toBe(201);
    const share = await state.db.vehicleShare.findFirstOrThrow({ where: { email: "expired@example.test" } }); await state.db.vehicleShare.update({ where: { id: share.id }, data: { expiresAt: new Date(0) } });
    state.userId = "expired"; expect((await accept(req(), ctx(share.id))).status).toBe(409);
    expect(await state.db.vehicle.findMany({ where: vehicleWhere("expired") })).toEqual([]);
  });
  it("applique immédiatement une rétrogradation puis une révocation sans supprimer les données", async () => {
    state.userId = "owner"; const share = await state.db.vehicleShare.findFirstOrThrow({ where: { recipientId: "complete-write" } });
    expect((await rights(req({ scope: "SIMPLE", permission: "READ" }, "PATCH"), shareContext(share.id))).status).toBe(200);
    state.userId = "complete-write"; expect((await addExpense(req({ vehicleId: "car", category: "AUTRE", amount: 2, date: "2026-02-01" }))).status).toBe(403); expect((await vehicleWorkspace("complete-write", "car")).vehicle).toBeNull();
    const counts = [await state.db.fuelEntry.count(), await state.db.expense.count(), await state.db.mileageReading.count(), await state.db.maintenanceRecord.count()];
    state.userId = "owner"; expect((await revoke(req({}, "DELETE"), shareContext(share.id))).status).toBe(200);
    await expect(requireVehicleAccess("complete-write", "car")).rejects.toMatchObject({ status: 404 });
    expect([await state.db.fuelEntry.count(), await state.db.expense.count(), await state.db.mileageReading.count(), await state.db.maintenanceRecord.count()]).toEqual(counts);
    state.userId = "outsider"; expect((await deleteSchedule(req({}, "DELETE"), ctx("schedule"))).status).toBe(404);
  });
  it("permet de quitter un partage sans toucher au véhicule et bloque les anonymes", async () => {
    const share = await state.db.vehicleShare.findFirstOrThrow({ where: { recipientId: "simple-read" } });
    state.userId = "simple-read"; expect((await leave(req({}, "DELETE"), ctx(share.id))).status).toBe(200);
    expect((await state.db.vehicle.findUniqueOrThrow({ where: { id: "car" } })).userId).toBe("owner");
    state.userId = null; expect((await invite(req(), ctx("car"))).status).toBe(401); expect((await accept(req(), ctx(share.id))).status).toBe(401);
  });
  it("refuse une suppression de document à un lecteur complet", async () => {
    state.userId = "complete-read"; expect((await deleteDocument(req({}, "DELETE"), ctx("document"))).status).toBe(403); expect(await state.db.vehicleDocument.count()).toBe(1);
  });
  it("préserve l’accès du compte après changement d’e-mail et refuse une seconde acceptation", async () => {
    await state.db.user.update({ where: { id: "complete-read" }, data: { email: "new-reader@example.test" } });
    state.userId = "owner"; expect((await invite(req({ email: "new-reader@example.test", scope: "SIMPLE", permission: "READ" }), ctx("car"))).status).toBe(201);
    const pending = await state.db.vehicleShare.findFirstOrThrow({ where: { email: "new-reader@example.test" } });
    state.userId = "complete-read"; expect((await accept(req(), ctx(pending.id))).status).toBe(409);
    expect((await requireVehicleAccess("complete-read", "car", "COMPLETE")).scope).toBe("COMPLETE");
    expect(await state.db.vehicleShare.count({ where: { vehicleId: "car", recipientId: "complete-read" } })).toBe(1);
  });
});
