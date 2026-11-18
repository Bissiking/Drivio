"use client";
import { useState } from "react";
import { Field } from "./field";
import { Select } from "@/components/ui/select";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { LABELS } from "@/lib/constants";
import { MAINTENANCE_GROUPS, maintenanceGroup, maintenanceLabel } from "@/lib/taxonomy";
import { detectMaintenance } from "@/lib/maintenance-detection";

export function MaintenanceTypeFields({ type = "PERSONNALISE", title = "" }: { type?: string; title?: string }) {
  const [selected, setSelected] = useState(type), [text, setText] = useState(title);
  const group = maintenanceGroup(selected) ?? MAINTENANCE_GROUPS.at(-1)!;
  const suggestion = detectMaintenance(text);
  return <>
    <Field label="Intitulé"><Input name="title" required minLength={2} maxLength={100} value={text} onChange={e => setText(e.target.value)} placeholder="Remplacement plaquettes avant" /></Field>
    <Field label="Catégorie"><Select value={group.id} onChange={e => setSelected(MAINTENANCE_GROUPS.find(g => g.id === e.target.value)!.generic)}>{MAINTENANCE_GROUPS.map(g => <option key={g.id} value={g.id}>{g.label}</option>)}</Select></Field>
    <Field label="Sous-catégorie"><Select name="type" value={selected} onChange={e => setSelected(e.target.value)}>{group.types.map(t => <option key={t} value={t}>{t === group.generic ? "Non précisée" : LABELS[t] ?? t}</option>)}</Select></Field>
    {text.trim().length >= 3 ? <div className="space-y-2 text-sm sm:col-span-2 lg:col-span-3" aria-live="polite">
      {suggestion.type && suggestion.type !== selected ? <><p className="text-[var(--muted)]">Suggestion : {maintenanceLabel(suggestion.type)}</p><Button type="button" variant="outline" onClick={() => setSelected(suggestion.type!)}>Utiliser cette suggestion</Button></> : suggestion.type === selected ? <p className="text-[var(--muted)]">Classification proposée retenue. Vous pouvez la modifier.</p> : <p className="text-[var(--muted)]">{suggestion.ambiguous ? "Plusieurs opérations reconnues : choisissez la catégorie principale ou créez des entretiens séparés." : "Aucune correspondance certaine. Choisissez une catégorie ou conservez « À classer »."}</p>}
    </div> : null}
  </>;
}
