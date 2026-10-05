// src/components/forms/fuel-form.tsx
import { ApiForm } from "./api-form";
import { Input } from "@/components/ui/input";
import { Field } from "./field";
import { Select } from "@/components/ui/select";
import { toDateInput } from "@/lib/format";

type VehicleOption = { id: string; brand: string; model: string };

export function FuelForm({ vehicles }: { vehicles: VehicleOption[] }) {
  return <ApiForm endpoint="/api/fuel" submitLabel="Enregistrer le plein">
    <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
      <Field label="Véhicule"><Select name="vehicleId">{vehicles.map((v) => <option key={v.id} value={v.id}>{v.brand} {v.model}</option>)}</Select></Field>
      <Field label="Date"><Input name="date" type="date" defaultValue={toDateInput()} required /></Field>
      <Field label="Kilométrage"><Input name="mileage" type="number" min="0" required /></Field>
      <Field label="Litres"><Input name="liters" type="number" min="0.01" step="0.01" required /></Field>
      <Field label="Prix total (€)"><Input name="totalPrice" type="number" min="0.01" step="0.01" required /></Field>
      <Field label="Prix au litre facultatif"><Input name="unitPrice" type="number" min="0" step="0.001" /></Field>
    </div>
    <label className="flex items-center gap-3 text-sm text-[var(--muted)]"><input name="isFull" type="checkbox" value="true" defaultChecked className="size-4 accent-[var(--accent)]" /> Plein complet — nécessaire pour une consommation fiable</label>
  </ApiForm>;
}
