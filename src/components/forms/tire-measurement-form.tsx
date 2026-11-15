// src/components/forms/tire-measurement-form.tsx
import { ApiForm } from "./api-form";
import { Field } from "./field";
import { Input } from "@/components/ui/input";
import { Select } from "@/components/ui/select";
import { toDateInput } from "@/lib/format";
export function TireMeasurementForm({ tires }: { tires: { id: string; brand: string; position: string }[] }) {
  return <ApiForm endpoint="/api/tire-measurements" submitLabel="Enregistrer la mesure réelle"><div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
    <Field label="Train de pneus"><Select name="tireSetId" required>{tires.map(t => <option key={t.id} value={t.id}>{t.brand} · {t.position}</option>)}</Select></Field>
    <Field label="Date de mesure"><Input name="date" type="date" defaultValue={toDateInput()} max={toDateInput()} required /></Field>
    <Field label="Compteur lors de la mesure (km)"><Input name="mileage" type="number" min="0" required /></Field>
    <Field label="Profondeur minimale relevée (mm)"><Input name="treadDepthMm" type="number" min="0" max="30" step="0.01" required /></Field>
    <Field label="Seuil de remplacement choisi (mm), facultatif"><Input name="targetDepthMm" type="number" min="0.01" max="30" step="0.01" /></Field>
    <Field label="Coût de remplacement estimé (€), facultatif"><Input name="replacementCost" type="number" min="0" step="0.01" /></Field>
    </div><p className="text-xs leading-5 text-[var(--muted)]">Mesurez avec un appareil adapté et retenez la profondeur la plus faible du train. Un seuil choisi ne constitue pas une préconisation constructeur. Les champs facultatifs vides conservent les réglages existants.</p></ApiForm>;
}
