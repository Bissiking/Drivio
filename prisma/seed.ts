// prisma/seed.ts
import path from "node:path";
import { PrismaBetterSqlite3 } from "@prisma/adapter-better-sqlite3";
import { PrismaClient } from "../src/generated/prisma/client";
import { buildVehicleImagePrompt } from "../src/lib/vehicle-image-prompts";

const configured = process.env.DATABASE_URL ?? "file:./prisma/dev.db";
const url = configured.startsWith("file:./") ? `file:${path.resolve(process.cwd(), configured.slice(5))}` : configured;
if (!url.startsWith("file:")) throw new Error("Le seed de développement attend une base SQLite.");
const db = new PrismaClient({ adapter: new PrismaBetterSqlite3({ url }) });

async function main() {
  const subject = process.env.KYROS_DEMO_SUB ?? "demo-matheo";
  const existing = await db.user.findUnique({ where: { kyrosSubject: subject } });
  if (existing) await db.user.delete({ where: { id: existing.id } });

  const user = await db.user.create({ data: { kyrosSubject: subject, email: "matheo@example.test", name: "Matheo" } });
  const vehicle = await db.vehicle.create({
    data: {
      userId: user.id,
      brand: "CUPRA",
      model: "Formentor",
      trim: "V",
      powertrain: "1.5 TSI 150 DSG7",
      year: 2024,
      registration: "DR-124-FV",
      purchaseDate: new Date("2026-03-02T12:00:00Z"),
      purchaseMileage: 32_980,
      purchasePrice: 34_900,
      status: "ACTIVE",
      isPrimary: true,
      photoPath: "/demo/formentor-night.png",
    },
  });

  const imageOptions = {
    color: "Cuivre métallisé",
    bodyStyle: "SUV compact",
    angle: "Trois-quarts avant, hauteur naturelle",
    scene: "Architecture urbaine sobre, parking en béton",
    lighting: "Heure bleue, lumière douce et réaliste",
    weather: "Temps calme, sol légèrement humide",
    imageStyle: "Photographie éditoriale automobile premium, naturelle et précise",
    aspectRatio: "paysage 3:2",
    details: "Jantes sombres, carrosserie de série et véhicule entièrement visible",
  };
  await db.vehicleImageRequest.create({
    data: { vehicleId: vehicle.id, ...imageOptions, prompt: buildVehicleImagePrompt(vehicle, imageOptions) },
  });

  const readings = [
    ["2026-03-02", 32_980, null],
    ["2026-03-31", 33_214, 234],
    ["2026-04-30", 33_648, 434],
    ["2026-05-31", 34_026, 378],
    ["2026-06-30", 34_402, 376],
    ["2026-07-31", 34_781, 379],
    ["2026-08-31", 35_124, 343],
  ] as const;
  await db.mileageReading.createMany({ data: readings.map(([date, mileage, distance], index) => ({ vehicleId: vehicle.id, date: new Date(`${date}T08:00:00Z`), mileage, distanceFromPrevious: distance, comment: index === readings.length - 1 ? "Relevé de fin de mois" : null })) });

  const fuelEntries = [
    { date: "2026-06-11", mileage: 34_168, liters: 43.82, totalPrice: 78.43, distance: null, consumption: null, cost: null },
    { date: "2026-06-29", mileage: 34_389, liters: 17.1, totalPrice: 30.45, distance: 221, consumption: 7.74, cost: 13.78 },
    { date: "2026-07-18", mileage: 34_632, liters: 18.36, totalPrice: 32.88, distance: 243, consumption: 7.56, cost: 13.53 },
    { date: "2026-08-06", mileage: 34_866, liters: 17.42, totalPrice: 31.18, distance: 234, consumption: 7.44, cost: 13.32 },
    { date: "2026-08-26", mileage: 35_089, liters: 16.95, totalPrice: 30.34, distance: 223, consumption: 7.6, cost: 13.61 },
  ];
  for (const entry of fuelEntries) {
    const date = new Date(`${entry.date}T18:00:00Z`);
    await db.fuelEntry.create({ data: { vehicleId: vehicle.id, date, mileage: entry.mileage, liters: entry.liters, totalPrice: entry.totalPrice, unitPrice: entry.totalPrice / entry.liters, isFull: true, distanceSincePrevious: entry.distance, consumptionPer100Km: entry.consumption, costPer100Km: entry.cost } });
    await db.expense.create({ data: { vehicleId: vehicle.id, category: "CARBURANT", amount: entry.totalPrice, date, mileage: entry.mileage, comment: `Plein · ${entry.liters.toFixed(2)} L` } });
  }

  await db.expense.createMany({ data: [
    { vehicleId: vehicle.id, category: "ASSURANCE", amount: 82.4, date: new Date("2026-08-02T09:00:00Z"), comment: "Mensualité assurance" },
    { vehicleId: vehicle.id, category: "PEAGE", amount: 18.8, date: new Date("2026-08-12T16:00:00Z"), mileage: 34_954, comment: "Trajet A10" },
    { vehicleId: vehicle.id, category: "PARKING", amount: 12.5, date: new Date("2026-08-19T14:00:00Z"), mileage: 35_018, comment: "Parking centre-ville" },
    { vehicleId: vehicle.id, category: "LAVAGE", amount: 14.9, date: new Date("2026-07-22T11:00:00Z"), comment: "Lavage haute pression" },
  ] });

  await db.maintenanceRecord.createMany({ data: [
    { vehicleId: vehicle.id, type: "ENTRETIEN_CONSTRUCTEUR", title: "Révision des 30 000 km", date: new Date("2026-03-08T10:00:00Z"), mileage: 33_040, cost: 289.5, notes: "Contrôle général et diagnostic" },
    { vehicleId: vehicle.id, type: "FILTRES", title: "Filtre d’habitacle", date: new Date("2026-05-16T10:00:00Z"), mileage: 33_844, cost: 48.9 },
  ] });
  await db.expense.createMany({ data: [
    { vehicleId: vehicle.id, category: "ENTRETIEN", amount: 289.5, date: new Date("2026-03-08T10:00:00Z"), mileage: 33_040, comment: "Révision des 30 000 km" },
    { vehicleId: vehicle.id, category: "ENTRETIEN", amount: 48.9, date: new Date("2026-05-16T10:00:00Z"), mileage: 33_844, comment: "Filtre d’habitacle" },
  ] });

  await db.maintenanceSchedule.createMany({ data: [
    { vehicleId: vehicle.id, type: "VIDANGE", title: "Vidange et filtre à huile", dueMileage: 40_000, dueDate: new Date("2027-03-08T10:00:00Z"), warningKm: 1_500, warningDays: 45 },
    { vehicleId: vehicle.id, type: "CONTROLE_TECHNIQUE", title: "Premier contrôle technique", dueDate: new Date("2028-02-15T10:00:00Z"), warningDays: 60 },
    { vehicleId: vehicle.id, type: "PNEUS", title: "Permutation des pneus", dueMileage: 36_000, warningKm: 1_000 },
  ] });
  console.info(`Seed Drivio créé pour ${subject} (${vehicle.brand} ${vehicle.model}).`);
}

main().finally(() => db.$disconnect());
