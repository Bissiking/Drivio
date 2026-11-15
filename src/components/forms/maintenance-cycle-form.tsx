// src/components/forms/maintenance-cycle-form.tsx
import { ApiForm } from "./api-form";
import { Field } from "./field";
import { Input } from "@/components/ui/input";
import { toDateInput } from "@/lib/format";
export function MaintenanceCycleForm({ schedule }: { schedule: { id: string; dueDate: Date | null; dueMileage: number | null; cycleStartDate: Date | null; cycleStartMileage: number | null } }) {
  return <ApiForm endpoint={`/api/maintenance/${schedule.id}/baseline`} method="PATCH" resetOnSuccess={false} submitLabel="Enregistrer la référence">
    <div className="grid gap-4 sm:grid-cols-2"><Field label="Début de l’intervalle (date)"><Input name="cycleStartDate" type="date" max={toDateInput()} defaultValue={schedule.cycleStartDate ? toDateInput(schedule.cycleStartDate) : ""} /></Field><Field label="Compteur au début de l’intervalle (km)"><Input name="cycleStartMileage" type="number" min="0" max={schedule.dueMileage === null ? undefined : schedule.dueMileage - 1} step="1" defaultValue={schedule.cycleStartMileage ?? ""} /></Field></div>
    <p className="max-w-prose text-xs leading-5 text-[var(--muted)]">Utilisez le dernier contrôle ou remplacement correspondant à cette échéance. La jauge part de 100 % à cette référence et atteint 0 % à l’échéance. Vider les deux champs rétablit la recherche automatique dans vos entretiens réalisés. Cela ne remet pas la pièce à neuf et ne marque pas l’entretien réalisé.</p>
  </ApiForm>;
}
