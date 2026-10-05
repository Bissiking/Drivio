import { z } from "zod";
import { db } from "./db";
import { warrantySchema, inspectionSchema, insuranceSchema, tireSchema } from "./validations";
export const recordKind = z.enum(["warranty", "inspection", "insurance", "tires"]);
export type RecordKind = z.infer<typeof recordKind>;
export async function findRecord(kind: RecordKind, id: string, userId: string) {
  const where = { id, vehicle: { userId } };
  switch (kind) {
    case "warranty": return db.warranty.findFirst({ where });
    case "inspection": return db.technicalInspection.findFirst({ where });
    case "insurance": return db.insurancePolicy.findFirst({ where });
    case "tires": return db.tireSet.findFirst({ where });
  }
}
export async function persistRecord(kind: RecordKind, body: unknown, id?: string) {
  switch (kind) {
    case "warranty": {
      const parsed = warrantySchema.parse(body), data = { ...parsed, maxMileage: parsed.maxMileage ?? null, notes: parsed.notes ?? null };
      return id ? db.warranty.update({ where: { id }, data }) : db.warranty.create({ data });
    }
    case "inspection": {
      const parsed = inspectionSchema.parse(body), data = { ...parsed, followUpDeadline: parsed.requiresFollowUp ? parsed.followUpDeadline : null, notes: parsed.notes ?? null };
      return id ? db.technicalInspection.update({ where: { id }, data }) : db.technicalInspection.create({ data });
    }
    case "insurance": {
      const parsed = insuranceSchema.parse(body), data = { ...parsed, cost: parsed.cost ?? null, contractReference: parsed.contractReference ?? null, notes: parsed.notes ?? null };
      return db.$transaction(async tx => {
        await tx.vehicle.update({ where: { id: data.vehicleId }, data: { updatedAt: new Date() } });
        if (data.includeInCosts) {
          const overlap = await tx.insurancePolicy.findFirst({ where: { vehicleId: data.vehicleId, includeInCosts: true, ...(id ? { id: { not: id } } : {}), startDate: { lt: data.renewalDate }, renewalDate: { gt: data.startDate } } });
          if (overlap) throw new Error("Un contrat déjà intégré aux coûts couvre cette période. Désactivez son intégration ou ajustez les dates.");
        }
        return id ? tx.insurancePolicy.update({ where: { id }, data }) : tx.insurancePolicy.create({ data });
      });
    }
    case "tires": {
      const parsed = tireSchema.parse(body), data = { ...parsed, model: parsed.model ?? null, removedAt: parsed.removedAt ?? null, removedMileage: parsed.removedMileage ?? null, notes: parsed.notes ?? null };
      return id ? db.tireSet.update({ where: { id }, data }) : db.tireSet.create({ data });
    }
  }
}
export async function deleteRecord(kind: RecordKind, id: string) {
  switch (kind) {
    case "warranty": return db.warranty.delete({ where: { id } });
    case "inspection": return db.technicalInspection.delete({ where: { id } });
    case "insurance": return db.insurancePolicy.delete({ where: { id } });
    case "tires": return db.tireSet.delete({ where: { id } });
  }
}
