import type { Prisma } from "@/generated/prisma/client";
import { z } from "zod";
import { db } from "./db";
import { VehicleAccessError } from "./vehicle-access";

export const shareRightsSchema = z.object({ scope: z.enum(["SIMPLE", "COMPLETE"]), permission: z.enum(["READ", "WRITE"]) });
export const shareInviteSchema = shareRightsSchema.extend({ email: z.email().trim().max(254).transform(v => v.toLowerCase()) });
export const shareScopeLabel = (scope: string) => scope === "COMPLETE" ? "Complet" : "Simple";
export const sharePermissionLabel = (permission: string) => permission === "WRITE" ? "Lecture/Modification" : "Lecture";

export async function manageVehicleShare<T>(userId: string, vehicleId: string, action: (tx: Prisma.TransactionClient) => Promise<T>) {
  // Grant/accept/revoke serialize against the same vehicle row as business writes.
  return db.$transaction(async tx => {
    const owner = await tx.vehicle.findFirst({ where: { id: vehicleId, userId } });
    if (!owner) throw new VehicleAccessError(404, "Véhicule introuvable.");
    await tx.vehicle.update({ where: { id: vehicleId }, data: { updatedAt: new Date() } });
    return action(tx);
  });
}
