// src/components/forms/expense-form.tsx
import { ApiForm } from "./api-form";
import { Input } from "@/components/ui/input";
import { Field } from "./field";
import { Select } from "@/components/ui/select";
import { Textarea } from "@/components/ui/textarea";
import { EXPENSE_CATEGORIES, LABELS } from "@/lib/constants";
import { toDateInput } from "@/lib/format";

type VehicleOption = { id: string; brand: string; model: string };

export function ExpenseForm({ vehicles }: { vehicles: VehicleOption[] }) {
  return <ApiForm endpoint="/api/expenses" submitLabel="Ajouter la dépense">
    <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
      <Field label="Véhicule"><Select name="vehicleId">{vehicles.map((v) => <option key={v.id} value={v.id}>{v.brand} {v.model}</option>)}</Select></Field>
      <Field label="Catégorie"><Select name="category">{EXPENSE_CATEGORIES.map((item) => <option key={item} value={item}>{LABELS[item]}</option>)}</Select></Field>
      <Field label="Montant (€)"><Input name="amount" type="number" min="0.01" step="0.01" required /></Field>
      <Field label="Date"><Input name="date" type="date" defaultValue={toDateInput()} required /></Field>
      <Field label="Kilométrage facultatif"><Input name="mileage" type="number" min="0" /></Field>
    </div>
    <Field label="Commentaire"><Textarea name="comment" /></Field>
  </ApiForm>;
}
