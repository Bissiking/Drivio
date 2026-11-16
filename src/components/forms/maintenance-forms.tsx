// src/components/forms/maintenance-forms.tsx
"use client";

import { ApiForm } from "./api-form";
import { Input } from "@/components/ui/input";
import { Field } from "./field";
import { Select } from "@/components/ui/select";
import { Textarea } from "@/components/ui/textarea";
import { LABELS, MAINTENANCE_TYPES } from "@/lib/constants";
import { toDateInput } from "@/lib/format";

type VehicleOption = { id: string; brand: string; model: string };
type SharedValues = { id: string; vehicleId: string; type: string; title: string; notes: string | null };
type RecordValues = SharedValues & { date: string; mileage: number | null; cost: number | null };
type ScheduleValues = SharedValues & {
  dueDate: string; dueMileage: number | null; warningDays: number; warningKm: number;
  provenance: string; reference: string | null; estimatedCost: number | null;
  cycleStartDate: string; cycleStartMileage: number | null;
};

function Shared({ vehicles, values }: { vehicles: VehicleOption[]; values?: SharedValues }) {
  return <><Field label="Véhicule"><Select name="vehicleId" defaultValue={values?.vehicleId}>{vehicles.map((v) => <option key={v.id} value={v.id}>{v.brand} {v.model}</option>)}</Select></Field><Field label="Type"><Select name="type" defaultValue={values?.type}>{MAINTENANCE_TYPES.map((type) => <option key={type} value={type}>{LABELS[type]}</option>)}</Select></Field><Field label="Intitulé"><Input name="title" required minLength={2} maxLength={100} defaultValue={values?.title} placeholder="Vidange moteur" /></Field></>;
}

export function MaintenanceRecordForm({ vehicles, record }: { vehicles: VehicleOption[]; record?: RecordValues }) {
  return <ApiForm endpoint={record ? `/api/maintenance/records/${record.id}` : "/api/maintenance"} method={record ? "PATCH" : "POST"} resetOnSuccess={!record} submitLabel={record ? "Enregistrer les modifications" : "Ajouter l’entretien"} transform={(data) => ({ ...data, kind: "record" })}>
    <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3"><Shared vehicles={vehicles} values={record} /><Field label="Date"><Input name="date" type="date" defaultValue={record?.date ?? toDateInput()} required /></Field><Field label="Kilométrage"><Input name="mileage" type="number" min="0" step="1" defaultValue={record?.mileage ?? ""} /></Field><Field label="Coût (€)"><Input name="cost" type="number" min="0" step="0.01" defaultValue={record?.cost ?? ""} /></Field></div>
    <Field label="Notes"><Textarea name="notes" defaultValue={record?.notes ?? ""} /></Field>
  </ApiForm>;
}

export function MaintenanceScheduleForm({ vehicles, schedule }: { vehicles: VehicleOption[]; schedule?: ScheduleValues }) {
  return <ApiForm endpoint={schedule ? `/api/maintenance/${schedule.id}` : "/api/maintenance"} method={schedule ? "PATCH" : "POST"} resetOnSuccess={!schedule} submitLabel={schedule ? "Enregistrer les modifications" : "Créer l’échéance"} transform={(data) => ({ ...data, kind: "schedule", ...(schedule ? { action: "update" } : {}) })}>
    <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3"><Shared vehicles={vehicles} values={schedule} /><Field label="Date d’échéance"><Input name="dueDate" type="date" defaultValue={schedule?.dueDate ?? ""} /></Field><Field label="Kilométrage d’échéance"><Input name="dueMileage" type="number" min="0" step="1" defaultValue={schedule?.dueMileage ?? ""} /></Field><Field label="Alerte avant (jours)"><Input name="warningDays" type="number" min="1" defaultValue={schedule?.warningDays ?? 30} /></Field><Field label="Alerte avant (km)"><Input name="warningKm" type="number" min="1" defaultValue={schedule?.warningKm ?? 1500} /></Field></div>
    <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3"><Field label="Provenance de l’échéance"><Select name="provenance" defaultValue={schedule?.provenance ?? "USER"}><option value="USER">Choix personnel</option><option value="MANUFACTURER">Préconisation constructeur documentée</option></Select></Field><Field label="Référence constructeur, si applicable"><Input name="reference" maxLength={500} defaultValue={schedule?.reference ?? ""} /></Field><Field label="Coût prévisionnel facultatif (€)"><Input name="estimatedCost" type="number" min="0" step="0.01" defaultValue={schedule?.estimatedCost ?? ""} /></Field></div>
    <details><summary className="cursor-pointer py-2 text-sm text-[var(--accent)]">Référence de départ pour la jauge (facultatif)</summary><div className="grid gap-4 pt-3 sm:grid-cols-2"><Field label="Début de l’intervalle (date)"><Input name="cycleStartDate" type="date" max={toDateInput()} defaultValue={schedule?.cycleStartDate ?? ""} /></Field><Field label="Compteur de départ (km)"><Input name="cycleStartMileage" type="number" min="0" step="1" defaultValue={schedule?.cycleStartMileage ?? ""} /></Field></div><p className="mt-3 text-xs text-[var(--muted)]">Sans référence renseignée, Drivio recherche un entretien réalisé compatible. Les kilomètres restants seuls ne permettent pas de connaître un pourcentage.</p></details>
    <Field label="Notes"><Textarea name="notes" defaultValue={schedule?.notes ?? ""} /></Field>
  </ApiForm>;
}
