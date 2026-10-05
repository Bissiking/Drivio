// src/lib/history.ts
import type { Expense, FuelEntry, MaintenanceRecord, MileageReading } from "@/generated/prisma/client";

export type HistoryEvent = {
  id: string;
  vehicleId: string;
  type: "mileage" | "fuel" | "maintenance" | "expense";
  date: Date;
  title: string;
  detail: string;
  amount?: number;
};

export function mergeHistory(input: {
  mileage: MileageReading[];
  fuel: FuelEntry[];
  maintenance: MaintenanceRecord[];
  expenses: Expense[];
}) {
  const fuelKeys = new Set(input.fuel.map((entry) => `${entry.vehicleId}-${entry.date.toISOString()}-${Number(entry.totalPrice).toFixed(2)}`));
  const events: HistoryEvent[] = [
    ...input.mileage.map((entry) => ({ id: entry.id, vehicleId: entry.vehicleId, type: "mileage" as const, date: entry.date, title: `${entry.mileage.toLocaleString("fr-FR")} km`, detail: entry.comment || (entry.distanceFromPrevious ? `+ ${entry.distanceFromPrevious.toLocaleString("fr-FR")} km` : "Premier relevé") })),
    ...input.fuel.map((entry) => ({ id: entry.id, vehicleId: entry.vehicleId, type: "fuel" as const, date: entry.date, title: "Plein de carburant", detail: `${Number(entry.liters).toLocaleString("fr-FR", { maximumFractionDigits: 2 })} L · ${entry.mileage.toLocaleString("fr-FR")} km`, amount: Number(entry.totalPrice) })),
    ...input.maintenance.map((entry) => ({ id: entry.id, vehicleId: entry.vehicleId, type: "maintenance" as const, date: entry.date, title: entry.title, detail: entry.mileage ? `${entry.mileage.toLocaleString("fr-FR")} km` : "Entretien", amount: entry.cost ? Number(entry.cost) : undefined })),
    ...input.expenses.filter((entry) => entry.category !== "CARBURANT" || !fuelKeys.has(`${entry.vehicleId}-${entry.date.toISOString()}-${Number(entry.amount).toFixed(2)}`)).map((entry) => ({ id: entry.id, vehicleId: entry.vehicleId, type: "expense" as const, date: entry.date, title: entry.comment || "Dépense", detail: entry.category, amount: Number(entry.amount) })),
  ];
  return events.sort((a, b) => b.date.getTime() - a.date.getTime());
}
