// src/components/forms/fuel-form.tsx
import { ApiForm } from "./api-form";
import { Input } from "@/components/ui/input";
import { Field } from "./field";
import { Select } from "@/components/ui/select";
import { toDateInput } from "@/lib/format";
import { FUELS } from "@/lib/fuel-types";

type VehicleOption = { id: string; brand: string; model: string };

export type FuelValues = { id: string; vehicleId: string; date: string; mileage: number; liters: number; totalPrice: number; unitPrice: number; isFull: boolean; stationId: string | null; fuelType: string | null };
export function FuelForm({ vehicles, entry, defaultVehicleId, onSuccess, onPendingChange }: { vehicles: VehicleOption[]; entry?: FuelValues; defaultVehicleId?: string; onSuccess?: () => void; onPendingChange?: (pending: boolean) => void }) {
  const availableVehicleId = defaultVehicleId && !vehicles.some(vehicle => vehicle.id === defaultVehicleId) ? "" : defaultVehicleId;
  return <ApiForm onSuccess={onSuccess} onPendingChange={onPendingChange} endpoint={entry ? `/api/fuel/${entry.id}` : "/api/fuel"} method={entry ? "PATCH" : "POST"} resetOnSuccess={!entry} submitLabel={entry ? "Enregistrer les modifications" : "Enregistrer le plein"}>
    <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
      <Field label="Véhicule"><Select name="vehicleId" required defaultValue={entry?.vehicleId ?? availableVehicleId}>{availableVehicleId === "" ? <option value="" disabled>Choisir un véhicule modifiable</option> : null}{vehicles.map((v) => <option key={v.id} value={v.id}>{v.brand} {v.model}</option>)}</Select></Field>
      <Field label="Date"><Input name="date" type="date" defaultValue={entry?.date ?? toDateInput()} required /></Field>
      <Field label="Kilométrage"><Input name="mileage" defaultValue={entry?.mileage} type="number" min="0" required /></Field>
      <Field label="Litres"><Input name="liters" defaultValue={entry?.liters} type="number" min="0.01" step="0.01" required /></Field>
      <Field label="Prix total (€)"><Input name="totalPrice" defaultValue={entry?.totalPrice} type="number" min="0.01" step="0.01" required /></Field>
      <Field label="Prix au litre facultatif"><Input name="unitPrice" defaultValue={entry?.unitPrice} type="number" min="0.001" step="0.001" /></Field>
      <Field label="Carburant, pour comparer les prix"><Select name="fuelType" defaultValue={entry?.fuelType ?? ""}><option value="">Non renseigné</option>{Object.entries(FUELS).map(([id, label]) => <option key={id} value={id}>{label}</option>)}</Select></Field>
      <Field label="Identifiant officiel de la station, facultatif"><Input name="stationId" defaultValue={entry?.stationId ?? ""} inputMode="numeric" pattern="[0-9]+" maxLength={20} /></Field>
    </div>
    <label className="flex items-center gap-3 text-sm text-[var(--muted)]"><input name="isFull" type="checkbox" value="true" defaultChecked={entry?.isFull ?? true} className="size-4 accent-[var(--accent)]" /> Plein complet — nécessaire pour une consommation fiable</label>
  </ApiForm>;
}
