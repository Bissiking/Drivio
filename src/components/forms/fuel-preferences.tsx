// src/components/forms/fuel-preferences.tsx
"use client";
import { ApiForm } from "./api-form";
export function FuelPreferences({ mobile, desktop }: { mobile: boolean; desktop: boolean }) {
  return <ApiForm endpoint="/api/preferences" method="PATCH" submitLabel="Enregistrer les préférences" resetOnSuccess={false}>
    <p className="text-sm text-[var(--muted)]">Ouvrir une fois le formulaire de plein après une nouvelle connexion Kyros. La rotation des jetons et la navigation ne le rouvrent pas.</p>
    <label className="flex min-h-11 items-center gap-3 text-sm"><input className="size-4 accent-[var(--accent)]" type="checkbox" name="autoFuelMobile" value="true" defaultChecked={mobile} />Sur mobile et petite tablette tactile</label>
    <label className="flex min-h-11 items-center gap-3 text-sm"><input className="size-4 accent-[var(--accent)]" type="checkbox" name="autoFuelDesktop" value="true" defaultChecked={desktop} />Sur ordinateur</label>
  </ApiForm>;
}
