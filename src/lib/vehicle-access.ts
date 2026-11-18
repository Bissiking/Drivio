import type { Prisma } from "@/generated/prisma/client";
import { db } from "./db";

export type VehicleScope = "SIMPLE" | "COMPLETE";
export const shareFor = (userId: string) => ({ where: { recipientId: userId, acceptedAt: { not: null } }, select: { scope: true, permission: true } } as const);
export function vehicleWhere(userId: string, scope: VehicleScope = "SIMPLE", write = false): Prisma.VehicleWhereInput {
  return { OR: [{ userId }, { shares: { some: { recipientId: userId, acceptedAt: { not: null }, ...(scope === "COMPLETE" ? { scope: "COMPLETE" } : {}), ...(write ? { permission: "WRITE" } : {}) } } }] };
}
export function vehicleRights(vehicle: { userId: string; shares: { scope: string; permission: string }[] }, userId: string) {
  const owner = vehicle.userId === userId, share = vehicle.shares?.[0];
  return { owner, scope: owner || share?.scope === "COMPLETE" ? "COMPLETE" as const : "SIMPLE" as const, canWrite: owner || share?.permission === "WRITE" };
}
export class VehicleAccessError extends Error {
  constructor(public status: 403 | 404, message: string) { super(message); }
}
export async function requireVehicleAccess(userId: string, id: string, scope: VehicleScope = "SIMPLE", write = false, client: Pick<Prisma.TransactionClient, "vehicle"> = db) {
  const vehicle = await client.vehicle.findFirst({ where: { id, ...vehicleWhere(userId) }, include: { shares: shareFor(userId) } });
  if (!vehicle) throw new VehicleAccessError(404, "Véhicule introuvable.");
  const rights = vehicleRights(vehicle, userId);
  if ((scope === "COMPLETE" && rights.scope !== "COMPLETE") || (write && !rights.canWrite)) throw new VehicleAccessError(403, write ? "Cet accès ne permet pas de modifier cette partie du véhicule." : "Cette partie du véhicule nécessite un partage complet.");
  return { vehicle, ...rights };
}
