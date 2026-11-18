"use client";
import { useState } from "react";
import { Button } from "@/components/ui/button";
type Application = {
  id: string;
  name: string;
  vehicles: string[];
  expiresAt: string;
};
export function HubApplications({
  applications,
}: {
  applications: Application[];
}) {
  const [items, setItems] = useState(applications),
    [busy, setBusy] = useState<string | null>(null),
    [error, setError] = useState("");
  async function revoke(id: string) {
    setBusy(id);
    setError("");
    try {
      const response = await fetch(
        `/api/preferences/hub/applications?id=${encodeURIComponent(id)}`,
        { method: "DELETE", signal: AbortSignal.timeout(15000) },
      );
      if (!response.ok)
        throw new Error("Impossible de retirer cet accès. Réessayez.");
      setItems((current) => current.filter((item) => item.id !== id));
    } catch (error) {
      setError(
        error instanceof Error ? error.message : "Drivio est injoignable.",
      );
    } finally {
      setBusy(null);
    }
  }
  return (
    <div>
      <p className="text-sm leading-6 text-[var(--muted)]">
        Connectez une application depuis son bouton « Connecter Drivio », puis
        choisissez sur la page d’autorisation les véhicules à partager. Pour
        modifier ce choix, relancez la connexion depuis l’application.
      </p>
      {items.length ? (
        <ul className="mt-5 divide-y divide-[var(--line)]">
          {items.map((item) => (
            <li
              key={item.id}
              className="flex flex-wrap items-start justify-between gap-4 py-5"
            >
              <div className="min-w-0">
                <strong className="font-medium">{item.name}</strong>
                <p className="mt-2 text-sm text-[var(--muted)]">
                  {item.vehicles.join(", ") ||
                    "Aucun véhicule encore disponible"}
                </p>
                <p className="mt-1 text-xs text-[var(--muted)]">
                  Lecture seule · Expire le{" "}
                  {new Date(item.expiresAt).toLocaleDateString("fr-FR")}
                </p>
              </div>
              <Button
                type="button"
                variant="outline"
                onClick={() => revoke(item.id)}
                disabled={busy !== null}
              >
                {busy === item.id ? "Suppression…" : "Retirer l’accès"}
              </Button>
            </li>
          ))}
        </ul>
      ) : (
        <p className="mt-5 text-sm">Aucune application autorisée.</p>
      )}
      {error ? (
        <p role="alert" className="mt-4 text-sm text-[var(--danger)]">
          {error}
        </p>
      ) : null}
    </div>
  );
}
