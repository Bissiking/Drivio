import { expect, it } from "vitest";
import { Prisma, type Expense, type FuelEntry, type MileageReading } from "@/generated/prisma/client";
import { mergeHistory } from "./history";

it("attribue chaque fait au véhicule et déduplique les miroirs uniquement dans ce véhicule", () => {
  const date = new Date("2026-10-05");
  const fuel: FuelEntry = { id: "fuel", vehicleId: "cupra", date, mileage: 35620, liters: new Prisma.Decimal(20), totalPrice: new Prisma.Decimal(40), unitPrice: new Prisma.Decimal(2), isFull: true, mileageReadingId: null, distanceSincePrevious: null, consumptionPer100Km: null, costPer100Km: null, createdAt: date, updatedAt: date };
  const mirror: Expense = { id: "mirror", vehicleId: "cupra", date, category: "CARBURANT", amount: new Prisma.Decimal(40), mileage: 35620, comment: null, fuelEntryId: null, maintenanceRecordId: null, createdAt: date, updatedAt: date };
  const otherExpense = { ...mirror, id: "other-expense", vehicleId: "clio" };
  const reading: MileageReading = { id: "reading", vehicleId: "clio", date, mileage: 5200, comment: null, distanceFromPrevious: 200, source: "MANUAL", isCorrection: false, createdAt: date, updatedAt: date };
  const events = mergeHistory({ mileage: [reading], fuel: [fuel], maintenance: [], expenses: [mirror, otherExpense] });
  expect(events.map(event => [event.id, event.vehicleId])).toEqual([
    ["reading", "clio"], ["fuel", "cupra"], ["other-expense", "clio"],
  ]);
});
