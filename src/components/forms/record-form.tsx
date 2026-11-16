// src/components/forms/record-form.tsx
// src/components/forms/record-form.tsx
"use client";
import { TireForm } from "./tire-form";
import { useId } from "react";
import { ApiForm } from "./api-form";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Select } from "@/components/ui/select";
import { Textarea } from "@/components/ui/textarea";
import { toDateInput } from "@/lib/format";
type Field = { name: string; label: string; type?: "date" | "number" | "checkbox" | "textarea"; required?: boolean; options?: [string, string][] };
const fields: Record<string, Field[]> = {
  warranty: [ { name: "title", label: "Nom de la garantie", required: true }, { name: "type", label: "Type", options: [["CONSTRUCTEUR", "Constructeur"], ["EXTENSION", "Extension"], ["OCCASION", "Occasion"], ["AUTRE", "Autre"]] }, { name: "startDate", label: "Début", type: "date", required: true }, { name: "endDate", label: "Fin", type: "date", required: true }, { name: "maxMileage", label: "Kilométrage maximum (facultatif)", type: "number" } ],
  inspection: [ { name: "date", label: "Dernier contrôle", type: "date", required: true }, { name: "nextDate", label: "Prochain contrôle", type: "date", required: true }, { name: "result", label: "Résultat", options: [["FAVORABLE", "Favorable"], ["DEFAVORABLE", "Défavorable"], ["CRITIQUE", "Défaillance critique"]] }, { name: "requiresFollowUp", label: "Contre-visite nécessaire", type: "checkbox" }, { name: "followUpDeadline", label: "Date limite de contre-visite", type: "date" } ],
  insurance: [ { name: "company", label: "Compagnie", required: true }, { name: "contractReference", label: "Référence du contrat" }, { name: "startDate", label: "Début", type: "date", required: true }, { name: "renewalDate", label: "Renouvellement", type: "date", required: true }, { name: "cost", label: "Coût (€)", type: "number" }, { name: "frequency", label: "Fréquence du coût", options: [["MONTHLY", "Mensuel"], ["ANNUAL", "Annuel"]] }, { name: "includeInCosts", label: "Intégrer les échéances dans les coûts calculés", type: "checkbox" } ],

};
export type RecordValues = Record<string, string | number | boolean | null>;
export function RecordForm({ kind, vehicleId, id, initial = {}, drivetrain }: { kind: "warranty" | "inspection" | "insurance" | "tires"; vehicleId: string; id?: string; initial?: RecordValues; drivetrain?: string }) {
  const prefix = useId();
  if (kind === "tires") return <TireForm vehicleId={vehicleId} id={id} initial={initial} drivetrain={drivetrain} />;
  const items = [...fields[kind], { name: "notes", label: "Notes", type: "textarea" } as Field];
  return <ApiForm endpoint={`/api/vehicle-records/${kind}${id ? `/${id}` : ""}`} method={id ? "PATCH" : "POST"} resetOnSuccess={!id} submitLabel={id ? "Enregistrer les modifications" : "Ajouter"}>
    <input type="hidden" name="vehicleId" value={vehicleId} />
    <div className="grid gap-4 sm:grid-cols-2">{items.map(f => {
      const inputId = `${prefix}-${f.name}`, value = initial[f.name] ?? (f.type === "date" && ["startDate", "date", "mountedAt"].includes(f.name) ? toDateInput() : "");
      if (f.type === "checkbox") return <label key={f.name} className="flex items-start gap-3 text-sm text-[var(--muted)] sm:col-span-2"><input type="checkbox" name={f.name} defaultChecked={value === true} value="true" className="mt-1 size-4 accent-[var(--accent)]" />{f.label}</label>;
      return <div key={f.name} className={f.type === "textarea" ? "sm:col-span-2" : ""}><Label htmlFor={inputId}>{f.label}</Label>{f.options ? <Select id={inputId} name={f.name} defaultValue={String(value || f.options[0][0])}>{f.options.map(([v, label]) => <option key={v} value={v}>{label}</option>)}</Select> : f.type === "textarea" ? <Textarea id={inputId} name={f.name} defaultValue={String(value)} maxLength={500} /> : <Input id={inputId} name={f.name} type={f.type ?? "text"} defaultValue={String(value)} required={f.required} min={f.type === "number" ? "0" : undefined} step={f.name === "cost" ? "0.01" : f.type === "number" ? "1" : undefined} />}</div>;
    })}</div>

    {kind === "insurance" ? <p className="text-xs leading-5 text-[var(--muted)]">Les échéances dues jusqu’au renouvellement sont calculées à partir du contrat. Une dépense Assurance saisie dans le même mois remplace le coût automatique de ce mois.</p> : null}
  </ApiForm>;
}
