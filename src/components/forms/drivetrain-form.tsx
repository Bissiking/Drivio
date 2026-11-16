"use client";

import { ApiForm } from "./api-form";
import { Field } from "./field";
import { Select } from "@/components/ui/select";
import { DRIVETRAINS, drivetrainLabels } from "@/lib/drivetrain";

export function DrivetrainForm({ vehicleId, drivetrain }: { vehicleId: string; drivetrain: string }) {
  return <details className="mt-5 border-t border-[var(--line-soft)] pt-3">
    <summary className="cursor-pointer py-2 text-sm text-[var(--accent)]">Modifier la transmission</summary>
    <ApiForm endpoint={`/api/vehicles/${vehicleId}`} method="PATCH" resetOnSuccess={false} submitLabel="Enregistrer la transmission" className="max-w-lg pt-3">
      <input type="hidden" name="action" value="drivetrain" />
      <Field label="Roues motrices"><Select name="drivetrain" defaultValue={drivetrain}>{DRIVETRAINS.map(value => <option key={value} value={value}>{value === "UNKNOWN" ? "Je ne sais pas" : drivetrainLabels[value]}</option>)}</Select></Field>
      <p className="text-xs leading-5 text-[var(--muted)]">Cette information sert à distinguer l’estimation d’usure des pneus avant et arrière.</p>
    </ApiForm>
  </details>;
}
