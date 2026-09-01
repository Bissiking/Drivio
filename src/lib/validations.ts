// src/lib/validations.ts
import { z } from "zod";
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
  isPrimary: z.coerce.boolean().default(false),
  photoPath: optionalText,
  photoUrl: z.preprocess((value) => (value === "" ? undefined : value), z.url().optional()),
});

export const mileageSchema = z.object({
  vehicleId: z.string().min(1),
  mileage: z.coerce.number().int().nonnegative(),
  date,
  comment: optionalText,
  allowCorrection: z.coerce.boolean().default(false),
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
  isFull: z.coerce.boolean().default(false),
});

export const vehicleImageRequestSchema = z.object({
  vehicleId: z.string().min(1),
  color: z.string().trim().min(2).max(80),
  bodyStyle: z.string().trim().min(2).max(80),
  angle: z.string().trim().min(2).max(100),
  scene: z.string().trim().min(2).max(160),
  lighting: z.string().trim().min(2).max(120),
  weather: z.string().trim().min(2).max(120),
  imageStyle: z.string().trim().min(2).max(160),
  aspectRatio: z.string().trim().min(2).max(30),
  details: optionalText,
});
