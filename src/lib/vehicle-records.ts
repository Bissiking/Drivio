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
      return db.$transaction(async tx => {
        // Lock the owning vehicle before reading its mountings, including on PostgreSQL.
        await tx.vehicle.update({ where: { id: data.vehicleId }, data: { updatedAt: new Date() } });
        const sets = await tx.tireSet.findMany({ where: { vehicleId: data.vehicleId, ...(id ? { id: { not: id } } : {}) }, include: { measurements: true } });
        const replaces: typeof sets = [];
        for (const previous of sets) {
          if (previous.position !== "COMPLET" && data.position !== "COMPLET" && previous.position !== data.position) continue;
          const before = previous.removedAt !== null && previous.removedAt <= data.mountedAt;
          const after = data.removedAt !== null && data.removedAt <= previous.mountedAt;
          if (before) {
            if (previous.removedMileage !== null && data.mountedMileage < previous.removedMileage) throw new Error("Le compteur de montage doit suivre le démontage précédent de cet essieu.");
          } else if (after) {
            if (data.removedMileage! > previous.mountedMileage) throw new Error("Le compteur de démontage dépasse le montage suivant de cet essieu.");
          } else if (!id && !data.removedAt && !previous.removedAt && previous.mountedAt <= data.mountedAt && previous.mountedMileage <= data.mountedMileage) {
            if (previous.measurements.some(m => m.date > data.mountedAt || m.mileage > data.mountedMileage)) throw new Error("Le nouveau montage précède une mesure déjà enregistrée sur les pneus remplacés.");
            replaces.push(previous);
          } else {
            throw new Error("Un montage couvre déjà cet essieu sur cette période. Ajustez les dates ou enregistrez un nouveau remplacement.");
          }
        }
        // Editing a record must also preserve its own observations.
        if (id) {
          const measurements = await tx.tireMeasurement.findMany({ where: { tireSetId: id } });
          if (measurements.some(m => m.date < data.mountedAt || m.mileage < data.mountedMileage || (data.removedAt && (m.date > data.removedAt || m.mileage > data.removedMileage!)))) throw new Error("Les dates et compteurs doivent inclure les mesures déjà enregistrées.");
        }
        for (const previous of replaces) {
          if (previous.position === "COMPLET" && data.position !== "COMPLET") {
            const { id: oldId, measurements, ...original } = previous;
            const replacementCost = previous.replacementCost === null ? null : Number(previous.replacementCost) / 2;
            // Represent the original four tyres as two axle histories; retain the original ID.
            await tx.tireSet.create({ data: {
              ...original, position: data.position === "AVANT" ? "ARRIERE" : "AVANT", replacementCost,
              measurements: { create: measurements.map(({ date, mileage, treadDepthMm, createdAt }) => ({ date, mileage, treadDepthMm, createdAt })) },
            } });
            await tx.tireSet.update({ where: { id: oldId }, data: { position: data.position, replacementCost, removedAt: data.mountedAt, removedMileage: data.mountedMileage } });
          } else {
            await tx.tireSet.update({ where: { id: previous.id }, data: { removedAt: data.mountedAt, removedMileage: data.mountedMileage } });
          }
        }
        return id ? tx.tireSet.update({ where: { id }, data }) : tx.tireSet.create({ data });
      });
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
