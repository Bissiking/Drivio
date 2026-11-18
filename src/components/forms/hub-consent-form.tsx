"use client";

import { useState } from "react";
import { ArrowRight, CarFront } from "lucide-react";
import { Button } from "@/components/ui/button";

type Vehicle = {
  id: string;
  brand: string;
  model: string;
  year: number;
  isPrimary: boolean;
  status: string;
};
export function HubConsentForm({
  intent,
  vehicles,
  initialSelected,
}: {
  intent: string;
  vehicles: Vehicle[];
  initialSelected: string[];
}) {
  const [selected, setSelected] = useState(() => initialSelected);
  const [busy, setBusy] = useState(false);
  return (
    <form
      action="/api/hub/authorize"
      method="post"
      onSubmit={(event) => {
        if (busy) event.preventDefault();
        else setBusy(true);
      }}
      aria-busy={busy}
    >
      <input type="hidden" name="intent" value={intent} />
      <fieldset>
        <legend className="mb-4 text-lg font-medium">
          Véhicules à partager
        </legend>
        {vehicles.length ? (
          <div className="divide-y divide-[var(--line-soft)]">
            {vehicles.map((vehicle) => (
              <label
                key={vehicle.id}
                className="flex cursor-pointer items-center gap-4 py-4"
              >
                <input
                  type="checkbox"
                  name="vehicle"
                  value={vehicle.id}
                  checked={selected.includes(vehicle.id)}
                  onChange={(event) =>
                    setSelected((ids) =>
                      event.target.checked
                        ? [...ids, vehicle.id]
                        : ids.filter((id) => id !== vehicle.id),
                    )
                  }
                  className="size-5 shrink-0 accent-[var(--accent)]"
                />
                <CarFront className="size-6 shrink-0 text-[var(--muted)]" />
                <span className="min-w-0">
                  <strong className="block font-medium">
                    {vehicle.brand} {vehicle.model}
                  </strong>
                  <span className="mt-1 block text-sm text-[var(--muted)]">
                    {vehicle.year}
                    {vehicle.isPrimary ? " · Principal" : ""}
                    {vehicle.status !== "ACTIVE" ? " · Archivé" : ""}
                  </span>
                </span>
              </label>
            ))}
          </div>
        ) : (
          <p className="py-5 text-[var(--muted)]">
            Votre garage est vide.{" "}
            <a className="underline" href="/garage">
              Ajoutez un véhicule dans Drivio
            </a>{" "}
            avant de connecter le Hub.
          </p>
        )}
      </fieldset>
      {vehicles.length && !selected.length ? (
        <p role="status" className="mt-3 text-sm text-[var(--muted)]">
          Choisissez au moins un véhicule pour autoriser le partage.
        </p>
      ) : null}
      <p className="mt-5 text-sm leading-6 text-[var(--muted)]">
        L’autorisation dure jusqu’à 90 jours et ne concerne que les véhicules
        sélectionnés. Les véhicules ajoutés plus tard ne seront pas partagés
        automatiquement.
      </p>
      <footer className="mt-8 flex flex-col-reverse gap-3 sm:flex-row sm:justify-end">
        <Button
          type="submit"
          name="decision"
          value="deny"
          variant="outline"
          size="lg"
          aria-disabled={busy}
        >
          Annuler
        </Button>
        <Button
          type="submit"
          name="decision"
          value="allow"
          size="lg"
          disabled={!selected.length}
          aria-disabled={busy}
        >
          Autoriser LUMA Hub
          <ArrowRight className="size-4" />
        </Button>
      </footer>
    </form>
  );
}
