import { afterAll, beforeAll, beforeEach, describe, expect, it, vi } from "vitest";
import { NextRequest } from "next/server";
import { testDatabase } from "@/test/database";

const state = vi.hoisted(() => ({ db: null as unknown as import("@/generated/prisma/client").PrismaClient, userId: "owner" as string | null }));
vi.mock("./db", () => ({ get db() { return state.db; } }));
vi.mock("./auth", () => ({ getCurrentUser: async () => state.userId ? state.db.user.findUnique({ where: { id: state.userId } }) : null }));

import { POST as createVehicle } from "@/app/api/vehicles/route";
import { PATCH as updateVehicle } from "@/app/api/vehicles/[id]/route";

let fixture: Awaited<ReturnType<typeof testDatabase>>;
const vehicleData = { brand: "Peugeot", model: "308", trim: "GT", year: 2022, purchaseDate: "2026-01-01", purchaseMileage: 10000 };
const request = (body: object, method = "POST") => new NextRequest("http://localhost/api/vehicles", { method, headers: { "content-type": "application/json" }, body: JSON.stringify(body) });
const context = (id = "car") => ({ params: Promise.resolve({ id }) });

beforeAll(async () => {
  fixture = await testDatabase();
  state.db = fixture.client;
  await state.db.user.createMany({ data: [{ id: "owner", kyrosSubject: "owner" }, { id: "outsider", kyrosSubject: "outsider" }] });
  await state.db.vehicle.create({ data: { ...vehicleData, purchaseDate: new Date(vehicleData.purchaseDate), id: "car", userId: "owner" } });
});
beforeEach(() => { state.userId = "owner"; });
afterAll(async () => { await fixture?.close(); });

describe.sequential("transmission des véhicules : API et propriété", () => {
  it.each(["FRONT", "REAR", "AWD", "UNKNOWN"])("persiste %s à la création et à la modification", async drivetrain => {
    const created = await createVehicle(request({ ...vehicleData, drivetrain, userId: "outsider" }));
    expect(created.status).toBe(201);
    const { vehicle } = await created.json();
    expect(await state.db.vehicle.findUniqueOrThrow({ where: { id: vehicle.id } })).toMatchObject({ drivetrain, userId: "owner" });
    expect(await state.db.mileageReading.count({ where: { vehicleId: vehicle.id, mileage: 10000 } })).toBe(1);

    expect((await updateVehicle(request({ action: "drivetrain", drivetrain }, "PATCH"), context())).status).toBe(200);
    expect(await state.db.vehicle.findUniqueOrThrow({ where: { id: "car" } })).toMatchObject({ drivetrain, userId: "owner" });
  });

  it("laisse la transmission inconnue si elle n'est pas renseignée à la création", async () => {
    const response = await createVehicle(request(vehicleData));
    expect(response.status).toBe(201);
    const { vehicle } = await response.json();
    expect((await state.db.vehicle.findUniqueOrThrow({ where: { id: vehicle.id } })).drivetrain).toBe("UNKNOWN");
  });

  it("refuse les valeurs invalides sans créer ni modifier de véhicule", async () => {
    const before = await state.db.vehicle.findUniqueOrThrow({ where: { id: "car" } });
    const count = await state.db.vehicle.count();
    for (const drivetrain of ["4WD", "", null]) {
      expect((await createVehicle(request({ ...vehicleData, drivetrain }))).status).toBe(400);
      expect((await updateVehicle(request({ action: "drivetrain", drivetrain }, "PATCH"), context())).status).toBe(400);
    }
    expect((await updateVehicle(request({ action: "drivetrain" }, "PATCH"), context())).status).toBe(400);
    expect(await state.db.vehicle.count()).toBe(count);
    expect(await state.db.vehicle.findUniqueOrThrow({ where: { id: "car" } })).toEqual(before);
  });

  it("exige une session pour créer ou modifier un véhicule", async () => {
    state.userId = null;
    const before = await state.db.vehicle.findUniqueOrThrow({ where: { id: "car" } });
    const count = await state.db.vehicle.count();
    expect((await createVehicle(request({ ...vehicleData, drivetrain: "FRONT" }))).status).toBe(401);
    expect((await updateVehicle(request({ action: "drivetrain", drivetrain: "REAR" }, "PATCH"), context())).status).toBe(401);
    expect(await state.db.vehicle.count()).toBe(count);
    expect(await state.db.vehicle.findUniqueOrThrow({ where: { id: "car" } })).toEqual(before);
  });

  it("refuse de modifier la transmission d'un autre propriétaire", async () => {
    state.userId = "outsider";
    const before = await state.db.vehicle.findUniqueOrThrow({ where: { id: "car" } });
    expect((await updateVehicle(request({ action: "drivetrain", drivetrain: "REAR" }, "PATCH"), context())).status).toBe(404);
    expect(await state.db.vehicle.findUniqueOrThrow({ where: { id: "car" } })).toEqual(before);
    expect((await updateVehicle(request({ action: "drivetrain", drivetrain: "REAR" }, "PATCH"), context("missing"))).status).toBe(404);
  });
});
