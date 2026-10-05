import { afterAll, beforeAll, describe, expect, it, vi } from "vitest";
import { mkdtemp, readFile, rm } from "node:fs/promises";
import os from "node:os";
import path from "node:path";
import Database from "better-sqlite3";
import { PrismaBetterSqlite3 } from "@prisma/adapter-better-sqlite3";
import { PrismaClient } from "@/generated/prisma/client";
import { NextRequest } from "next/server";
const state = vi.hoisted(() => ({ db: null as unknown as import("@/generated/prisma/client").PrismaClient, userId: "owner" }));
vi.mock("@/lib/db", () => ({ get db() { return state.db; } }));
vi.mock("@/lib/auth", () => ({ getCurrentUser: async () => ({ id: state.userId, kyrosSubject: state.userId }) }));
import { POST as addFuel } from "@/app/api/fuel/route";
import { POST as addMileage } from "@/app/api/mileage/route";
import { PATCH as editMileage, DELETE as deleteMileage } from "@/app/api/mileage/[id]/route";
import { POST as addRecord } from "@/app/api/vehicle-records/[kind]/route";
import { PATCH as editRecord } from "@/app/api/vehicle-records/[kind]/[id]/route";
import { POST as addDocument } from "@/app/api/documents/route";
import { GET as getDocument, DELETE as deleteDocument } from "@/app/api/documents/[id]/route";
import { POST as saveNotifications } from "@/app/api/notifications/settings/route";
import { sendNotifications } from "./gotify";
let directory: string;
const request = (body: object, method = "POST") => new NextRequest("http://localhost/api", { method, headers: { "Content-Type": "application/json" }, body: JSON.stringify(body) });
const context = (id: string) => ({ params: Promise.resolve({ id }) });
beforeAll(async () => {
  directory = await mkdtemp(path.join(os.tmpdir(), "drivio-workflows-"));
  const file = path.join(directory, "test.db"), sqlite = new Database(file);
  for (const name of ["20260831173755_init", "20260831194500_vehicle_image_requests"]) sqlite.exec(await readFile(`prisma/migrations/${name}/migration.sql`, "utf8"));
  sqlite.exec(`INSERT INTO "User" (id, kyrosSubject, updatedAt) VALUES ('legacy-user', 'legacy-sub', CURRENT_TIMESTAMP);
  INSERT INTO "Vehicle" (id, userId, brand, model, trim, year, purchaseDate, purchaseMileage, purchasePrice, photoPath, updatedAt) VALUES ('legacy-car', 'legacy-user', 'Renault', 'Clio', 'V', 2023, '2026-01-01T00:00:00.000Z', 10000, 19000, '/uploads/personal.png', CURRENT_TIMESTAMP);
  INSERT INTO "MileageReading" (id, vehicleId, mileage, date, updatedAt) VALUES ('legacy-reading', 'legacy-car', 11000, '2026-02-01T00:00:00.000Z', CURRENT_TIMESTAMP);
  INSERT INTO "Expense" (id, vehicleId, category, amount, date, updatedAt) VALUES ('legacy-expense', 'legacy-car', 'AUTRE', 25.50, '2026-02-01T00:00:00.000Z', CURRENT_TIMESTAMP);`);
  sqlite.exec(await readFile("prisma/migrations/20261005120000_drivio_120/migration.sql", "utf8"));
  expect(sqlite.pragma("foreign_key_check")).toEqual([]); sqlite.close();
  state.db = new PrismaClient({ adapter: new PrismaBetterSqlite3({ url: `file:${file}` }) });
  await state.db.user.createMany({ data: [{ id: "owner", kyrosSubject: "owner" }, { id: "outsider", kyrosSubject: "outsider" }] });
  for (const [id, userId] of [["car", "owner"], ["other-car", "outsider"]]) {
    await state.db.vehicle.create({ data: { id, userId, brand: "Test", model: "Car", trim: "V", year: 2023, purchaseDate: new Date("2026-01-01"), purchaseMileage: 1000 } });
    await state.db.mileageReading.create({ data: { vehicleId: id, mileage: 1000, date: new Date("2026-01-01") } });
  }
  vi.stubEnv("DRIVIO_DOCUMENT_DIR", path.join(directory, "documents"));
  vi.stubEnv("SESSION_SECRET", "test-only-secret-at-least-32-characters");
});
afterAll(async () => { await state.db.$disconnect(); await rm(directory, { recursive: true, force: true }); vi.unstubAllEnvs(); vi.unstubAllGlobals(); });
describe.sequential("migration et mutations transactionnelles 1.2.0", () => {
  it("conserve les véhicules, photos, relevés et dépenses de la version précédente", async () => {
    const legacy = await state.db.vehicle.findUniqueOrThrow({ where: { id: "legacy-car" }, include: { mileageReadings: true, expenses: true } });
    expect(legacy.photoPath).toBe("/uploads/personal.png"); expect(Number(legacy.purchasePrice)).toBe(19000);
    expect(legacy.mileageReadings[0].mileage).toBe(11000); expect(Number(legacy.expenses[0].amount)).toBe(25.5);
  });
  it("réutilise le relevé identique au plein et crée une seule dépense", async () => {
    await addMileage(request({ vehicleId: "car", date: "2026-01-10", mileage: 1100 }));
    const response = await addFuel(request({ vehicleId: "car", date: "2026-01-10", mileage: 1100, liters: 20, totalPrice: 40, isFull: true }));
    expect(response.status).toBe(201);
    expect(await state.db.mileageReading.count({ where: { vehicleId: "car", mileage: 1100 } })).toBe(1);
    expect(await state.db.expense.count({ where: { vehicleId: "car", category: "CARBURANT" } })).toBe(1);
  });
  it("insère un ancien plein et recalcule aussi le plein suivant", async () => {
    const response = await addFuel(request({ vehicleId: "car", date: "2026-01-05", mileage: 1050, liters: 10, totalPrice: 20, isFull: true }));
    expect(response.status).toBe(201);
    const next = await state.db.fuelEntry.findFirstOrThrow({ where: { vehicleId: "car", mileage: 1100 } });
    expect(next.distanceSincePrevious).toBe(50); expect(Number(next.consumptionPer100Km)).toBe(40);
    const reading = await state.db.mileageReading.findFirstOrThrow({ where: { vehicleId: "car", mileage: 1050 } });
    expect(reading.source).toBe("FUEL"); expect(reading.distanceFromPrevious).toBe(50);
  });
  it("corrige un relevé, son plein lié, sa dépense et les distances voisines", async () => {
    const reading = await state.db.mileageReading.findFirstOrThrow({ where: { vehicleId: "car", mileage: 1100 } });
    expect((await editMileage(request({ mileage: 1150, date: "2026-01-11", comment: "Corrigé" }, "PATCH"), context(reading.id))).status).toBe(200);
    const fuel = await state.db.fuelEntry.findFirstOrThrow({ where: { mileageReadingId: reading.id }, include: { expense: true } });
    expect(fuel.mileage).toBe(1150); expect(fuel.distanceSincePrevious).toBe(100); expect(Number(fuel.consumptionPer100Km)).toBe(20);
    expect(fuel.expense?.mileage).toBe(1150); expect(fuel.expense?.date.toISOString()).toBe("2026-01-11T00:00:00.000Z");
    expect((await state.db.mileageReading.findUniqueOrThrow({ where: { id: reading.id } })).isCorrection).toBe(true);
  });
  it("refuse une incohérence avec le relevé suivant sans écrire partiellement", async () => {
    const counts = [await state.db.fuelEntry.count(), await state.db.expense.count(), await state.db.mileageReading.count()];
    expect((await addFuel(request({ vehicleId: "car", date: "2026-01-07", mileage: 9000, liters: 10, totalPrice: 20, isFull: true }))).status).toBe(409);
    expect([await state.db.fuelEntry.count(), await state.db.expense.count(), await state.db.mileageReading.count()]).toEqual(counts);
  });
  it("refuse les relevés futurs et confirme explicitement les baisses", async () => {
    expect((await addMileage(request({ vehicleId: "car", date: "2099-01-01", mileage: 2000 }))).status).toBe(409);
    const reading = await state.db.mileageReading.findFirstOrThrow({ where: { vehicleId: "car", mileage: 1150 } });
    expect((await editMileage(request({ mileage: 900, date: "2026-01-11", allowCorrection: false }, "PATCH"), context(reading.id))).status).toBe(409);
    expect((await editMileage(request({ mileage: 900, date: "2026-01-11", allowCorrection: true }, "PATCH"), context(reading.id))).status).toBe(200);
    expect((await state.db.fuelEntry.findFirstOrThrow({ where: { mileageReadingId: reading.id } })).consumptionPer100Km).toBeNull();
  });
  it("supprime un relevé et conserve le plein en le dissociant", async () => {
    const reading = await state.db.mileageReading.findFirstOrThrow({ where: { vehicleId: "car", mileage: 900 } });
    const fuel = await state.db.fuelEntry.findFirstOrThrow({ where: { mileageReadingId: reading.id } });
    expect((await deleteMileage(request({}, "DELETE"), context(reading.id))).status).toBe(200);
    expect((await state.db.fuelEntry.findUniqueOrThrow({ where: { id: fuel.id } })).mileageReadingId).toBeNull();
  });
  it("isole les créations et modifications entre utilisateurs", async () => {
    expect((await addFuel(request({ vehicleId: "other-car", date: "2026-01-03", mileage: 1100, liters: 10, totalPrice: 20 }))).status).toBe(404);
    const other = await state.db.mileageReading.findFirstOrThrow({ where: { vehicleId: "other-car" } });
    expect((await editMileage(request({ mileage: 5000, date: "2026-01-01" }, "PATCH"), context(other.id))).status).toBe(404);
    expect((await addRecord(request({ vehicleId: "other-car" }), { params: Promise.resolve({ kind: "warranty" }) })).status).toBe(404);
  });
  it("valide les garanties et empêche de transférer un contrat à un autre utilisateur", async () => {
    const body = { vehicleId: "car", title: "Garantie", type: "CONSTRUCTEUR", startDate: "2026-01-01", endDate: "2027-01-01", maxMileage: 50000 };
    const response = await addRecord(request(body), { params: Promise.resolve({ kind: "warranty" }) });
    expect(response.status).toBe(201); const { record } = await response.json();
    expect((await editRecord(request({ ...body, vehicleId: "other-car", title: "Modifiée" }, "PATCH"), { params: Promise.resolve({ kind: "warranty", id: record.id }) })).status).toBe(200);
    expect((await state.db.warranty.findUniqueOrThrow({ where: { id: record.id } })).vehicleId).toBe("car");
    expect((await addRecord(request({ ...body, endDate: "2025-01-01" }), { params: Promise.resolve({ kind: "warranty" }) })).status).toBe(400);
  });
  it("stocke, télécharge et supprime un document avec contrôle de propriété", async () => {
    const data = new FormData(); for (const [key, value] of Object.entries({ vehicleId: "car", title: "Facture", category: "ACHAT", date: "2026-01-01" })) data.set(key, value);
    data.set("file", new File(["%PDF-1.7\n%%EOF"], "facture.pdf", { type: "application/pdf" }));
    const response = await addDocument(new NextRequest("http://localhost/api/documents", { method: "POST", body: data }));
    expect(response.status).toBe(201); const { document } = await response.json();
    expect((await getDocument(new NextRequest("http://localhost/api/documents"), context(document.id))).status).toBe(200);
    state.userId = "outsider";
    expect((await getDocument(new NextRequest("http://localhost/api/documents"), context(document.id))).status).toBe(404);
    expect((await deleteDocument(request({}, "DELETE"), context(document.id))).status).toBe(404);
    state.userId = "owner";
    const stored = await state.db.vehicleDocument.findUniqueOrThrow({ where: { id: document.id } });
    expect((await deleteDocument(request({}, "DELETE"), context(document.id))).status).toBe(200);
    await expect(readFile(path.join(directory, "documents", stored.storageKey))).rejects.toThrow();
  });
  it("rejette les documents déguisés en PDF", async () => {
    const data = new FormData(); for (const [key, value] of Object.entries({ vehicleId: "car", title: "Faux fichier", category: "AUTRE", date: "2026-01-01" })) data.set(key, value);
    data.set("file", new File(["<html>invalid</html>"], "faux.pdf", { type: "application/pdf" }));
    expect((await addDocument(new NextRequest("http://localhost/api/documents", { method: "POST", body: data }))).status).toBe(415);
  });
  it("permet de désactiver individuellement une garantie expirée", async () => {
    await state.db.warranty.updateMany({ where: { vehicleId: "car" }, data: { endDate: new Date("2026-01-10") } });
    await saveNotifications(request({ enabled: true, warranty: true, enabledTypes: ["warrantySoon"], warningDays: 365, warningKm: 50000, token: "private-token" }));
    const fetchMock = vi.fn().mockResolvedValue({ ok: true }); vi.stubGlobal("fetch", fetchMock);
    expect((await sendNotifications("owner")).sent).toBe(0); expect(fetchMock).not.toHaveBeenCalled();
  });
  it("sauvegarde Gotify sans exposer le token et déduplique les envois", async () => {
    const response = await saveNotifications(request({ enabled: true, maintenance: false, warranty: true, inspection: false, insurance: false, warningDays: 365, warningKm: 50000, token: "private-token" }));
    expect(response.status).toBe(200); expect(await response.text()).not.toContain("private-token");
    await state.db.warranty.updateMany({ where: { vehicleId: "car" }, data: { endDate: new Date("2026-01-10") } });
    const fetchMock = vi.fn().mockResolvedValue({ ok: true }); vi.stubGlobal("fetch", fetchMock);
    const first = await sendNotifications("owner"), second = await sendNotifications("owner");
    expect(first.sent).toBe(1); expect(second.sent).toBe(0); expect(second.skipped).toBe(1); expect(fetchMock).toHaveBeenCalledTimes(1);
    expect(await state.db.notificationDelivery.count({ where: { userId: "outsider" } })).toBe(0);
  });
});
