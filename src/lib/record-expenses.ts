import type { Prisma } from "@/generated/prisma/client";

export class RecordExpenseConflict extends Error {}

type OriginalRecord = {
  id: string;
  vehicleId: string;
  date: Date;
  mileage: number | null;
  amount: Prisma.Decimal | number | null;
};

// Resolve against the original values, while the caller holds the vehicle lock.
// Never guess between multiple historical expenses or competing source records.
export async function recordExpense(tx: Prisma.TransactionClient, kind: "fuel" | "maintenance", original: OriginalRecord) {
  const relation = kind === "fuel" ? { fuelEntryId: original.id } : { maintenanceRecordId: original.id };
  const linked = await tx.expense.findUnique({ where: relation });
  if (linked || original.amount === null) return linked;
  const sameAmount = (amount: Prisma.Decimal | number | null) => amount !== null && Math.abs(Number(amount) - Number(original.amount)) < 0.005;
  const candidates = (await tx.expense.findMany({ where: {
    vehicleId: original.vehicleId, category: kind === "fuel" ? "CARBURANT" : "ENTRETIEN",
    date: original.date, mileage: original.mileage, fuelEntryId: null, maintenanceRecordId: null,
  } })).filter(expense => sameAmount(expense.amount));
  if (!candidates.length) return null;
  const where = { vehicleId: original.vehicleId, date: original.date, mileage: original.mileage };
  const sources = kind === "fuel"
    ? (await tx.fuelEntry.findMany({ where: { ...where, mileage: original.mileage! } })).filter(record => sameAmount(record.totalPrice))
    : (await tx.maintenanceRecord.findMany({ where })).filter(record => sameAmount(record.cost));
  if (candidates.length !== 1 || sources.length !== 1) throw new RecordExpenseConflict("Plusieurs écritures historiques peuvent correspondre à cette opération. Aucune modification n’a été enregistrée ; vérifiez les dépenses associées.");
  return candidates[0];
}
