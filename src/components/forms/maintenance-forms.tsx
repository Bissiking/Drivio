// src/components/forms/maintenance-forms.tsx
"use client";

import { ApiForm } from "./api-form";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Select } from "@/components/ui/select";
import { Textarea } from "@/components/ui/textarea";
import { LABELS, MAINTENANCE_TYPES } from "@/lib/constants";
import { toDateInput } from "@/lib/format";

type VehicleOption = { id: string; brand: string; model: string };

function Shared({ vehicles }: { vehicles: VehicleOption[] }) {
  return <><Field label="Véhicule"><Select name="vehicleId">{vehicles.map((v) => <option key={v.id} value={v.id}>{v.brand} {v.model}</option>)}</Select></Field><Field label="Type"><Select name="type">{MAINTENANCE_TYPES.map((type) => <option key={type} value={type}>{LABELS[type]}</option>)}</Select></Field><Field label="Intitulé"><Input name="title" required placeholder="Vidange moteur" /></Field></>;
}

export function MaintenanceRecordForm({ vehicles }: { vehicles: VehicleOption[] }) {
  return <ApiForm endpoint="/api/maintenance" submitLabel="Ajouter l’entretien" transform={(data) => ({ ...data, kind: "record" })}>
    <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3"><Shared vehicles={vehicles} /><Field label="Date"><Input name="date" type="date" defaultValue={toDateInput()} required /></Field><Field label="Kilométrage"><Input name="mileage" type="number" min="0" /></Field><Field label="Coût (€)"><Input name="cost" type="number" min="0" step="0.01" /></Field></div>
    <Field label="Notes"><Textarea name="notes" /></Field>
  </ApiForm>;
}

export function MaintenanceScheduleForm({ vehicles }: { vehicles: VehicleOption[] }) {
  return <ApiForm endpoint="/api/maintenance" submitLabel="Créer l’échéance" transform={(data) => ({ ...data, kind: "schedule" })}>
    <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3"><Shared vehicles={vehicles} /><Field label="Date d’échéance"><Input name="dueDate" type="date" /></Field><Field label="Kilométrage d’échéance"><Input name="dueMileage" type="number" min="0" /></Field><Field label="Alerte avant (jours)"><Input name="warningDays" type="number" min="1" defaultValue="30" /></Field><Field label="Alerte avant (km)"><Input name="warningKm" type="number" min="1" defaultValue="1500" /></Field></div>
    <Field label="Notes"><Textarea name="notes" /></Field>
  </ApiForm>;
}
function Field({ label, children }: { label: string; children: React.ReactNode }) { return <div><Label>{label}</Label>{children}</div>; }
