// src/components/forms/vehicle-archive-form.tsx
"use client";

import { useRouter } from "next/navigation";
import { useState } from "react";
import { Archive } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { toDateInput } from "@/lib/format";

export function VehicleArchiveForm({ vehicleId, currentMileage }: { vehicleId: string; currentMileage: number }) {
  const router = useRouter();
  const [pending, setPending] = useState(false);
  const [error, setError] = useState("");
  async function submit(event: React.FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setPending(true);
    setError("");
    const data = Object.fromEntries(new FormData(event.currentTarget));
    const response = await fetch(`/api/vehicles/${vehicleId}`, { method: "PATCH", headers: { "content-type": "application/json" }, body: JSON.stringify({ ...data, action: "archive" }) });
    const payload = (await response.json()) as { error?: string };
    setPending(false);
    if (!response.ok) return setError(payload.error ?? "Archivage impossible.");
    router.refresh();
  }
  return <details className="mt-5 border-t border-[var(--line-soft)] pt-4"><summary className="cursor-pointer list-none text-xs text-[var(--muted)] hover:text-[var(--text)]">Vente, reprise ou archivage</summary><form onSubmit={submit} className="mt-4 grid gap-4 rounded-xl bg-[var(--ink)] p-4 sm:grid-cols-3"><div><Label>Date de vente/reprise</Label><Input name="saleDate" type="date" defaultValue={toDateInput()} /></div><div><Label>Kilométrage final</Label><Input name="finalMileage" type="number" min={currentMileage} defaultValue={currentMileage} /></div><div><Label>Prix de vente/reprise (€)</Label><Input name="salePrice" type="number" min="0" step="0.01" /></div><div className="sm:col-span-3">{error ? <p className="mb-3 text-xs text-[var(--danger)]">{error}</p> : null}<Button type="submit" size="sm" variant="ghost" disabled={pending}><Archive className="size-3.5" />{pending ? "Archivage…" : "Archiver le véhicule"}</Button></div></form></details>;
}
