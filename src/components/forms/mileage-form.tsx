// src/components/forms/mileage-form.tsx
import { ApiForm } from "./api-form";
import { Input } from "@/components/ui/input";
import { Field } from "./field";
import { Select } from "@/components/ui/select";
import { Textarea } from "@/components/ui/textarea";
import { toDateInput } from "@/lib/format";

type VehicleOption = { id: string; brand: string; model: string };

export function MileageForm({ vehicles }: { vehicles: VehicleOption[] }) {
  return <ApiForm endpoint="/api/mileage" submitLabel="Ajouter le relevé" className="max-w-3xl">
    <div className="grid gap-4 sm:grid-cols-3">
      <Field label="Véhicule"><Select name="vehicleId" required>{vehicles.map((v) => <option key={v.id} value={v.id}>{v.brand} {v.model}</option>)}</Select></Field>
      <Field label="Kilométrage"><Input name="mileage" type="number" min="0" required /></Field>
      <Field label="Date"><Input name="date" type="date" defaultValue={toDateInput()} required /></Field>
    </div>
    <Field label="Commentaire"><Textarea name="comment" placeholder="Contexte facultatif" /></Field>
    <label className="flex items-start gap-3 text-sm leading-6 text-[var(--muted)]"><input type="checkbox" name="allowCorrection" value="true" className="mt-1 size-4 accent-[var(--accent)]" /> Correction explicite : autoriser une valeur inférieure au relevé précédent.</label>
  </ApiForm>;
}
