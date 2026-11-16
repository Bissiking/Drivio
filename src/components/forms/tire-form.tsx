"use client";

import Link from "next/link";
import { useId, useState } from "react";
import { ApiForm } from "./api-form";
import { Field } from "./field";
import { Input } from "@/components/ui/input";
import { Select } from "@/components/ui/select";
import { Textarea } from "@/components/ui/textarea";
import { drivetrainLabels } from "@/lib/drivetrain";
import { tireLifeAssumption, tirePositionLabels, tireQualityLabels, tireSeasonLabels, type TireAxle } from "@/lib/tire-estimation";
import { toDateInput } from "@/lib/format";
import type { RecordValues } from "./record-form";

export function TireForm({ vehicleId, id, initial = {}, drivetrain = "UNKNOWN" }: { vehicleId: string; id?: string; initial?: RecordValues; drivetrain?: string }) {
  const prefix = useId();
  const defaults = { position: String(initial.position ?? "COMPLET"), type: String(initial.type ?? "ETE"), quality: String(initial.quality ?? "UNKNOWN"), estimatedLifeKm: String(initial.estimatedLifeKm ?? "") };
  const [draft, setDraft] = useState(defaults);
  const axles: TireAxle[] = draft.position === "COMPLET" ? ["AVANT", "ARRIERE"] : [draft.position as TireAxle];
  const change = (field: keyof typeof draft, value: string) => setDraft(previous => ({ ...previous, [field]: value }));
  const estimates = axles.map(position => ({ position, ...tireLifeAssumption({ ...draft, position, estimatedLifeKm: Number(draft.estimatedLifeKm) || null }, drivetrain) }));
  return <div onReset={() => setDraft(defaults)}><ApiForm endpoint={`/api/vehicle-records/tires${id ? `/${id}` : ""}`} method={id ? "PATCH" : "POST"} resetOnSuccess={!id} submitLabel={id ? "Enregistrer les modifications" : "Enregistrer le montage"}>
    <input type="hidden" name="vehicleId" value={vehicleId} />
    <div className="grid gap-4 sm:grid-cols-2">
      <Field label="Pneus montés"><Select name="position" value={draft.position} onChange={event => change("position", event.target.value)}>{Object.entries(tirePositionLabels).map(([value, label]) => <option key={value} value={value}>{label}</option>)}</Select></Field>
      <Field label="Saison"><Select name="type" value={draft.type} onChange={event => change("type", event.target.value)}>{Object.entries(tireSeasonLabels).map(([value, label]) => <option key={value} value={value}>{label}</option>)}</Select></Field>
      <Field label="Marque"><Input name="brand" list={`${prefix}-brands`} defaultValue={String(initial.brand ?? "")} required minLength={2} maxLength={100} placeholder="Ex. Michelin, Continental, Hankook…" /><datalist id={`${prefix}-brands`}>{["Michelin", "Continental", "Hankook", "Bridgestone", "Goodyear", "Pirelli", "Dunlop", "Falken", "Kumho", "Nexen", "Toyo", "Norauto"].map(brand => <option key={brand} value={brand} />)}</datalist></Field>
      <Field label="Gamme"><Select name="quality" value={draft.quality} onChange={event => change("quality", event.target.value)}>{Object.entries(tireQualityLabels).map(([value, label]) => <option key={value} value={value}>{value === "UNKNOWN" ? "Je ne sais pas" : label}</option>)}</Select></Field>
      <Field label="Dimensions"><Input name="dimensions" defaultValue={String(initial.dimensions ?? "")} required maxLength={60} placeholder="Ex. 225/45 R18" /></Field>
      <Field label="Modèle (facultatif)"><Input name="model" defaultValue={String(initial.model ?? "")} maxLength={500} placeholder="Ex. Primacy 4" /></Field>
      <Field label="Date de montage"><Input name="mountedAt" type="date" required max={toDateInput()} defaultValue={String(initial.mountedAt ?? toDateInput())} /></Field>
      <Field label="Compteur au montage (km)"><Input name="mountedMileage" type="number" required min={0} step={1} defaultValue={String(initial.mountedMileage ?? "")} /></Field>
    </div>
    {!id ? <p className="text-xs leading-5 text-[var(--muted)]">Le montage clôture les anciens pneus sur l’essieu choisi, à cette date et à ce compteur. L’autre essieu conserve son suivi.</p> : null}
    <div className="space-y-2 border-y border-[var(--line-soft)] py-4">
      <p className="text-sm font-medium">{draft.estimatedLifeKm ? "Longévité manuelle" : "Estimation automatique"}</p>
      <p className="text-xs leading-5 text-[var(--muted)]">{drivetrainLabels[drivetrain]} · <Link href={`/garage#vehicle-${vehicleId}`} className="text-[var(--accent)] underline underline-offset-4">Modifier au garage</Link></p>
      <dl aria-live="polite" className="flex flex-wrap gap-x-8 gap-y-3 pt-1">{estimates.map(estimate => <div key={estimate.position}><dt className="text-xs text-[var(--muted)]">{tirePositionLabels[estimate.position]}</dt><dd className="mt-1 text-sm tabular-nums">{estimate.lifeKm.toLocaleString("fr-FR")} km supposés</dd></div>)}</dl>
      <details className="pt-1"><summary className="cursor-pointer py-2 text-xs text-[var(--accent)]">Comment est calculée cette estimation ?</summary><div className="space-y-2 pt-2 text-xs leading-5 text-[var(--muted)]">{estimates.map(estimate => <p key={estimate.position}>{tirePositionLabels[estimate.position]} : {estimate.formula}.</p>)}<p>Les bases et coefficients sont des hypothèses Drivio, sans étalonnage sur vos pneus. Le calcul ne connaît ni la pression, ni la géométrie, ni la conduite, ni les conditions de température.</p></div></details>
      <p className="max-w-prose text-xs leading-5 text-[var(--muted)]">La saison, la gamme et les roues motrices ajustent une hypothèse de planification. La marque reste libre : une gamme ne garantit pas la durée de vie d’un modèle.</p>
    </div>
    <details open={initial.removedAt ? true : undefined}>
      <summary className="cursor-pointer py-2 text-sm text-[var(--accent)]">Longévité personnalisée, démontage et notes</summary>
      <div className="grid gap-4 pt-4 sm:grid-cols-2">
        <div className="sm:col-span-2"><Field label="Longévité manuelle par essieu (km, facultatif)"><Input name="estimatedLifeKm" type="number" min={100} max={300000} step={1} value={draft.estimatedLifeKm} onChange={event => change("estimatedLifeKm", event.target.value)} placeholder="Vide : estimation automatique" /></Field><p className="mt-2 text-xs leading-5 text-[var(--muted)]">Une valeur remplace le calcul automatique. Effacez-la pour reprendre la saison, la gamme et la transmission. Les anciennes valeurs sont conservées.</p></div>
        <Field label="Date de démontage"><Input name="removedAt" type="date" max={toDateInput()} defaultValue={String(initial.removedAt ?? "")} /></Field>
        <Field label="Compteur au démontage (km)"><Input name="removedMileage" type="number" min={0} step={1} defaultValue={String(initial.removedMileage ?? "")} /></Field>
        <div className="sm:col-span-2"><Field label="Notes"><Textarea name="notes" defaultValue={String(initial.notes ?? "")} maxLength={500} /></Field></div>
      </div>
    </details>
    <p className="max-w-prose text-xs leading-5 text-[var(--warning)]">Usure estimée — contrôle manuel nécessaire. Les kilomètres supposés et les pourcentages ne mesurent pas l’état réel des pneus.</p>
  </ApiForm></div>;
}
