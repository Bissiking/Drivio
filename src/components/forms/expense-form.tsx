// src/components/forms/expense-form.tsx
import { ApiForm } from "./api-form";
import { Input } from "@/components/ui/input";
import { Field } from "./field";
import { Select } from "@/components/ui/select";
import { Textarea } from "@/components/ui/textarea";
import { ExpenseTypeFields } from "./expense-type-fields";
import { toDateInput } from "@/lib/format";

type VehicleOption = { id: string; brand: string; model: string };

export type ExpenseValues = { id: string; vehicleId: string; category: string; subcategory: string | null; amount: number; date: string; mileage: number | null; comment: string | null; maintenanceRecordId: string | null };
export function ExpenseForm({ vehicles, expense, defaultVehicleId, onSuccess, onPendingChange }: { vehicles: VehicleOption[]; expense?: ExpenseValues; defaultVehicleId?: string; onSuccess?: () => void; onPendingChange?: (pending: boolean) => void }) {
  const availableVehicleId = defaultVehicleId && !vehicles.some(vehicle => vehicle.id === defaultVehicleId) ? "" : defaultVehicleId;
  return <ApiForm onSuccess={onSuccess} onPendingChange={onPendingChange} endpoint={expense ? `/api/expenses/${expense.id}` : "/api/expenses"} method={expense ? "PATCH" : "POST"} resetOnSuccess={!expense} submitLabel={expense ? "Enregistrer les modifications" : "Ajouter la dépense"}>
    <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
      <Field label="Véhicule"><Select name="vehicleId" required defaultValue={expense?.vehicleId ?? availableVehicleId}>{availableVehicleId === "" ? <option value="" disabled>Choisir un véhicule modifiable</option> : null}{vehicles.map((v) => <option key={v.id} value={v.id}>{v.brand} {v.model}</option>)}</Select></Field>
      <ExpenseTypeFields category={expense?.category} subcategory={expense?.subcategory} linked={Boolean(expense?.maintenanceRecordId)} />
      <Field label="Montant (€)"><Input name="amount" defaultValue={expense?.amount} type="number" min="0.01" step="0.01" required /></Field>
      <Field label="Date"><Input name="date" type="date" defaultValue={expense?.date ?? toDateInput()} required /></Field>
      <Field label="Kilométrage facultatif"><Input name="mileage" defaultValue={expense?.mileage ?? ""} type="number" min="0" /></Field>
    </div>
    <Field label="Commentaire"><Textarea name="comment" defaultValue={expense?.comment ?? ""} /></Field>
  </ApiForm>;
}
