// src/lib/validations.ts
import { z } from "zod";
import { NOTIFICATION_TYPES } from "./notification-types";
import { EXPENSE_CATEGORIES, MAINTENANCE_TYPES, VEHICLE_STATUSES } from "./constants";

const optionalText = z.preprocess((value) => (value === "" ? undefined : value), z.string().trim().max(500).optional());
const optionalNumber = z.preprocess((value) => (value === "" || value === null ? undefined : value), z.coerce.number().nonnegative().optional());
const date = z.coerce.date();

export const vehicleSchema = z.object({
  brand: z.string().trim().min(1).max(60),
  model: z.string().trim().min(1).max(80),
  trim: z.string().trim().min(1).max(100),
  powertrain: optionalText,
  year: z.coerce.number().int().min(1886).max(new Date().getFullYear() + 1),
  registration: optionalText,
  vin: z.preprocess((value) => (value === "" ? undefined : value), z.string().trim().min(11).max(17).optional()),
  purchaseDate: date,
  purchaseMileage: z.coerce.number().int().nonnegative(),
  purchasePrice: optionalNumber,
  saleDate: z.preprocess((value) => (value === "" ? undefined : value), z.coerce.date().optional()),
  finalMileage: optionalNumber,
  salePrice: optionalNumber,
  status: z.enum(VEHICLE_STATUSES).default("ACTIVE"),
  isPrimary: z.preprocess((value) => value === true || value === "true" || value === "on", z.boolean()).default(false),
  photoPath: optionalText,
  photoUrl: z.preprocess((value) => (value === "" ? undefined : value), z.url().optional()),
});

export const mileageSchema = z.object({
  vehicleId: z.string().min(1),
  mileage: z.coerce.number().int().nonnegative(),
  date,
  comment: optionalText,
  allowCorrection: z.preprocess((value) => value === true || value === "true" || value === "on", z.boolean()).default(false),
});

export const maintenanceRecordSchema = z.object({
  vehicleId: z.string().min(1),
  type: z.enum(MAINTENANCE_TYPES),
  title: z.string().trim().min(2).max(100),
  date,
  mileage: optionalNumber,
  cost: optionalNumber,
  notes: optionalText,
});

export const maintenanceScheduleSchema = z
  .object({
    vehicleId: z.string().min(1),
    type: z.enum(MAINTENANCE_TYPES),
    title: z.string().trim().min(2).max(100),
    dueDate: z.preprocess((value) => (value === "" ? undefined : value), z.coerce.date().optional()),
    dueMileage: optionalNumber,
    warningDays: z.coerce.number().int().positive().default(30),
    warningKm: z.coerce.number().int().positive().default(1500),
    notes: optionalText,
  })
  .refine((data) => data.dueDate || data.dueMileage !== undefined, {
    message: "Indiquez une date, un kilométrage ou les deux.",
    path: ["dueDate"],
  });

export const expenseSchema = z.object({
  vehicleId: z.string().min(1),
  category: z.enum(EXPENSE_CATEGORIES),
  amount: z.coerce.number().positive(),
  date,
  mileage: optionalNumber,
  comment: optionalText,
});

export const fuelSchema = z.object({
  vehicleId: z.string().min(1),
  date,
  mileage: z.coerce.number().int().nonnegative(),
  liters: z.coerce.number().positive(),
  totalPrice: z.coerce.number().positive(),
  unitPrice: optionalNumber,
  isFull: z.preprocess((value) => value === true || value === "true" || value === "on", z.boolean()).default(false),
});


const optionalDate = z.preprocess((value) => value === "" || value == null ? undefined : value, date.optional());
const optionalMileage = z.preprocess((value) => value === "" || value == null ? undefined : value, z.coerce.number().int().nonnegative().optional());
const boolean = z.preprocess((value) => value === true || value === "true" || value === "on", z.boolean());
const title = z.string().trim().min(2).max(100);
export const warrantySchema = z.object({ vehicleId: z.string().min(1), title, type: z.enum(["CONSTRUCTEUR", "EXTENSION", "OCCASION", "AUTRE"]), startDate: date, endDate: date, maxMileage: optionalMileage, notes: optionalText }).refine(d => d.endDate >= d.startDate, { message: "La fin doit suivre le début de garantie.", path: ["endDate"] });
export const inspectionSchema = z.object({ vehicleId: z.string().min(1), date, nextDate: date, result: z.enum(["FAVORABLE", "DEFAVORABLE", "CRITIQUE"]), requiresFollowUp: boolean, followUpDeadline: optionalDate, notes: optionalText }).refine(d => d.nextDate > d.date, { message: "Le prochain contrôle doit suivre le dernier.", path: ["nextDate"] }).refine(d => !d.requiresFollowUp || (d.followUpDeadline && d.followUpDeadline >= d.date), { message: "Renseignez une date limite de contre-visite après le contrôle.", path: ["followUpDeadline"] });
export const insuranceSchema = z.object({ vehicleId: z.string().min(1), company: title, contractReference: optionalText, startDate: date, renewalDate: date, cost: optionalNumber, frequency: z.enum(["MONTHLY", "ANNUAL"]), includeInCosts: boolean, notes: optionalText }).refine(d => d.renewalDate > d.startDate, { message: "Le renouvellement doit suivre le début du contrat.", path: ["renewalDate"] });
export const tireSchema = z.object({ vehicleId: z.string().min(1), brand: title, model: optionalText, dimensions: z.string().trim().min(2).max(60), type: z.enum(["ETE", "HIVER", "QUATRE_SAISONS"]), position: z.enum(["AVANT", "ARRIERE", "COMPLET"]), mountedAt: date, mountedMileage: z.coerce.number().int().nonnegative(), removedAt: optionalDate, removedMileage: optionalMileage, notes: optionalText }).refine(d => (d.removedAt == null) === (d.removedMileage == null), { message: "Le démontage exige sa date et son kilométrage.", path: ["removedAt"] }).refine(d => !d.removedAt || (d.removedAt >= d.mountedAt && d.removedMileage! >= d.mountedMileage), { message: "Le démontage ne peut précéder le montage.", path: ["removedAt"] });
export const documentSchema = z.object({ vehicleId: z.string().min(1), title, category: z.enum(["ACHAT", "ENTRETIEN", "CONTROLE_TECHNIQUE", "ASSURANCE", "CONSTRUCTEUR", "AUTRE"]), date, description: optionalText });
export const notificationSchema = z.object({ enabledTypes: z.array(z.enum(NOTIFICATION_TYPES)).default([...NOTIFICATION_TYPES]), enabled: boolean, maintenance: boolean, warranty: boolean, inspection: boolean, insurance: boolean, warningDays: z.coerce.number().int().min(1).max(365), warningKm: z.coerce.number().int().min(1).max(50000), token: z.string().max(500).optional(), clearToken: boolean });
