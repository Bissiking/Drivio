// src/components/forms/vehicle-form.tsx
"use client";

import { useRouter } from "next/navigation";
import { useRef, useState } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Select } from "@/components/ui/select";
import { toDateInput } from "@/lib/format";

export function VehicleForm() {
  const router = useRouter();
  const ref = useRef<HTMLFormElement>(null);
  const [pending, setPending] = useState(false);
  const [message, setMessage] = useState<{ error?: string; success?: string }>({});
  async function submit(event: React.FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setPending(true);
    setMessage({});
    try {
      const data = new FormData(event.currentTarget);
      const file = data.get("photo");
      let photoPath: string | undefined;
      if (file instanceof File && file.size > 0) {
        const upload = new FormData();
        upload.set("file", file);
        const uploadResponse = await fetch("/api/upload", { method: "POST", body: upload });
        const uploadPayload = (await uploadResponse.json()) as { path?: string; error?: string };
        if (!uploadResponse.ok || !uploadPayload.path) throw new Error(uploadPayload.error ?? "Téléversement impossible.");
        photoPath = uploadPayload.path;
      }
      const body = Object.fromEntries(data);
      delete body.photo;
      const response = await fetch("/api/vehicles", { method: "POST", headers: { "content-type": "application/json" }, body: JSON.stringify({ ...body, photoPath, isPrimary: data.get("isPrimary") === "true" }) });
      const payload = (await response.json()) as { error?: string };
      if (!response.ok) throw new Error(payload.error ?? "Création impossible.");
      ref.current?.reset();
      setMessage({ success: "Véhicule ajouté au garage." });
      router.refresh();
    } catch (error) {
      setMessage({ error: error instanceof Error ? error.message : "Une erreur est survenue." });
    } finally {
      setPending(false);
    }
  }
  return <form ref={ref} onSubmit={submit} className="space-y-5">
    <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
      <Field label="Marque"><Input name="brand" required placeholder="CUPRA" /></Field>
      <Field label="Modèle"><Input name="model" required placeholder="Formentor" /></Field>
      <Field label="Finition"><Input name="trim" required placeholder="V" /></Field>
      <Field label="Motorisation"><Input name="powertrain" placeholder="1.5 TSI 150 DSG7" /></Field>
      <Field label="Année"><Input name="year" type="number" required min="1886" defaultValue={new Date().getFullYear()} /></Field>
      <Field label="Immatriculation"><Input name="registration" autoComplete="off" /></Field>
      <Field label="VIN"><Input name="vin" minLength={11} maxLength={17} autoComplete="off" /></Field>
      <Field label="Date d’achat"><Input name="purchaseDate" type="date" required defaultValue={toDateInput()} /></Field>
      <Field label="Kilométrage à l’achat"><Input name="purchaseMileage" type="number" min="0" required /></Field>
      <Field label="Prix d’achat (€)"><Input name="purchasePrice" type="number" min="0" step="0.01" /></Field>
      <Field label="Statut"><Select name="status"><option value="ACTIVE">Actif</option><option value="ARCHIVED">Archivé</option></Select></Field>
      <Field label="Photo (JPG, PNG ou WebP)"><Input name="photo" type="file" accept="image/jpeg,image/png,image/webp" /></Field>
      <Field label="URL de photo alternative"><Input name="photoUrl" type="url" placeholder="https://…" /></Field>
    </div>
    <label className="flex items-center gap-3 text-sm text-[var(--muted)]"><input type="checkbox" name="isPrimary" value="true" className="size-4 accent-[var(--accent)]" /> Définir comme véhicule principal</label>
    {message.error ? <p role="alert" className="text-sm text-[var(--danger)]">{message.error}</p> : null}
    {message.success ? <p role="status" className="text-sm text-[var(--accent)]">{message.success}</p> : null}
    <Button type="submit" disabled={pending}>{pending ? "Ajout en cours…" : "Ajouter le véhicule"}</Button>
  </form>;
}

function Field({ label, children }: { label: string; children: React.ReactNode }) {
  return <div><Label>{label}</Label>{children}</div>;
}
