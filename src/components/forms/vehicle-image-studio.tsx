// src/components/forms/vehicle-image-studio.tsx
"use client";

import Image from "next/image";
import { useRouter } from "next/navigation";
import { cloneElement, isValidElement, useMemo, useState } from "react";
import { Check, Clipboard, ImagePlus, Upload } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Select } from "@/components/ui/select";
import { Textarea } from "@/components/ui/textarea";

type VehicleOption = {
  id: string;
  brand: string;
  model: string;
  trim: string;
  powertrain: string | null;
  year: number;
  photoPath: string | null;
  photoUrl: string | null;
};

type ImageRequest = {
  id: string;
  vehicleId: string;
  color: string;
  angle: string;
  scene: string;
  prompt: string;
  status: string;
  resultPath: string | null;
  resultUrl: string | null;
  createdAt: string;
};

export function VehicleImageStudio({ vehicles, initialRequests }: { vehicles: VehicleOption[]; initialRequests: ImageRequest[] }) {
  const router = useRouter();
  const [vehicleId, setVehicleId] = useState(vehicles[0]?.id ?? "");
  const [requests, setRequests] = useState(initialRequests);
  const [latestPrompt, setLatestPrompt] = useState("");
  const [pending, setPending] = useState(false);
  const [message, setMessage] = useState<{ error?: string; success?: string }>({});
  const selectedVehicle = vehicles.find((vehicle) => vehicle.id === vehicleId) ?? vehicles[0];
  const vehicleRequests = useMemo(() => requests.filter((request) => request.vehicleId === vehicleId), [requests, vehicleId]);
  const preview = selectedVehicle?.photoPath || selectedVehicle?.photoUrl || "/demo/vehicle-default.png";

  async function createRequest(event: React.FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setPending(true);
    setMessage({});
    try {
      const data = new FormData(event.currentTarget);
      const response = await fetch("/api/image-requests", {
        method: "POST",
        headers: { "content-type": "application/json" },
        body: JSON.stringify(Object.fromEntries(data)),
      });
      const payload = (await response.json()) as { imageRequest?: ImageRequest; error?: string };
      if (!response.ok || !payload.imageRequest) throw new Error(payload.error ?? "Création impossible.");
      const created = { ...payload.imageRequest, createdAt: new Date(payload.imageRequest.createdAt).toISOString() };
      setRequests((current) => [created, ...current]);
      setLatestPrompt(created.prompt);
      setMessage({ success: "Demande enregistrée. Le prompt est prêt à être copié." });
    } catch (error) {
      setMessage({ error: error instanceof Error ? error.message : "Une erreur est survenue." });
    } finally {
      setPending(false);
    }
  }

  async function copyPrompt(prompt: string) {
    try {
      await navigator.clipboard.writeText(prompt);
      setMessage({ success: "Prompt copié dans le presse-papiers." });
    } catch {
      setMessage({ error: "Copie automatique impossible. Sélectionnez le prompt manuellement." });
    }
  }

  async function uploadFile(file: File) {
    const body = new FormData();
    body.set("file", file);
    const response = await fetch("/api/upload", { method: "POST", body });
    const payload = (await response.json()) as { path?: string; error?: string };
    if (!response.ok || !payload.path) throw new Error(payload.error ?? "Téléversement impossible.");
    return payload.path;
  }

  async function applyOwnPhoto(event: React.FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setPending(true);
    setMessage({});
    try {
      const data = new FormData(event.currentTarget);
      const file = data.get("photo");
      const photoUrl = String(data.get("photoUrl") ?? "").trim() || undefined;
      const photoPath = file instanceof File && file.size ? await uploadFile(file) : undefined;
      if (!photoPath && !photoUrl) throw new Error("Choisissez un fichier ou indiquez une URL.");
      const response = await fetch(`/api/vehicles/${vehicleId}`, {
        method: "PATCH",
        headers: { "content-type": "application/json" },
        body: JSON.stringify({ action: "photo", photoPath, photoUrl }),
      });
      const payload = (await response.json()) as { error?: string };
      if (!response.ok) throw new Error(payload.error ?? "Mise à jour impossible.");
      setMessage({ success: "La photo personnelle est maintenant utilisée pour ce véhicule." });
      event.currentTarget.reset();
      router.refresh();
    } catch (error) {
      setMessage({ error: error instanceof Error ? error.message : "Une erreur est survenue." });
    } finally {
      setPending(false);
    }
  }

  async function completeRequest(event: React.FormEvent<HTMLFormElement>, requestId: string) {
    event.preventDefault();
    setPending(true);
    setMessage({});
    try {
      const data = new FormData(event.currentTarget);
      const file = data.get("result");
      const photoUrl = String(data.get("resultUrl") ?? "").trim() || undefined;
      const photoPath = file instanceof File && file.size ? await uploadFile(file) : undefined;
      if (!photoPath && !photoUrl) throw new Error("Ajoutez l’image générée ou son URL.");
      const response = await fetch(`/api/image-requests/${requestId}`, {
        method: "PATCH",
        headers: { "content-type": "application/json" },
        body: JSON.stringify({ action: "complete", photoPath, photoUrl }),
      });
      const payload = (await response.json()) as { error?: string };
      if (!response.ok) throw new Error(payload.error ?? "Ajout impossible.");
      setRequests((current) => current.map((request) => request.id === requestId ? { ...request, status: "COMPLETED", resultPath: photoPath ?? null, resultUrl: photoUrl ?? null } : request));
      setMessage({ success: "Résultat ajouté et défini comme image active du véhicule." });
      router.refresh();
    } catch (error) {
      setMessage({ error: error instanceof Error ? error.message : "Une erreur est survenue." });
    } finally {
      setPending(false);
    }
  }

  return <div className="space-y-6">
    <section className="overflow-hidden rounded-2xl bg-[var(--surface)] lg:grid lg:grid-cols-[minmax(0,1.15fr)_minmax(390px,.85fr)]">
      <div className="relative min-h-72 border-b border-[var(--line-soft)] lg:min-h-[620px] lg:border-b-0 lg:border-r">
        <Image src={preview} alt={selectedVehicle ? `${selectedVehicle.brand} ${selectedVehicle.model}` : "Véhicule sans photo"} fill priority unoptimized={Boolean(selectedVehicle?.photoUrl && !selectedVehicle.photoPath)} sizes="(max-width:1024px) 100vw, 56vw" className="bg-black object-contain" />
        <div className="absolute inset-x-0 bottom-0 bg-black/70 px-5 py-4 sm:px-6">
          <p className="text-lg font-medium">{selectedVehicle?.brand} {selectedVehicle?.model}</p>
          <p className="mt-1 text-xs text-white/65">{selectedVehicle?.year} · {selectedVehicle?.trim} · {selectedVehicle?.powertrain || "Motorisation non renseignée"}</p>
        </div>
      </div>
      <form onSubmit={createRequest} className="p-5 sm:p-6">
        <h2 className="text-lg font-medium">Préparer une demande</h2>
        <p className="mt-2 text-sm leading-6 text-[var(--muted)]">Drivio rédige le prompt. Tu le copies dans l’outil de ton choix, puis tu reviens ajouter le résultat.</p>
        <div className="mt-6 space-y-4">
          <Field label="Véhicule"><Select name="vehicleId" value={vehicleId} onChange={(event) => { setVehicleId(event.target.value); setLatestPrompt(""); }} required>{vehicles.map((vehicle) => <option key={vehicle.id} value={vehicle.id}>{vehicle.brand} {vehicle.model} · {vehicle.year}</option>)}</Select></Field>
          <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-1 xl:grid-cols-2">
            <Field label="Couleur exacte"><Input name="color" required placeholder="Cuivre métallisé" /></Field>
            <Field label="Type de carrosserie"><Select name="bodyStyle" defaultValue="SUV compact"><option>SUV compact</option><option>Berline</option><option>Break</option><option>Coupé</option><option>Citadine</option><option>Utilitaire</option><option>Autre</option></Select></Field>
            <Field label="Angle de vue"><Select name="angle" defaultValue="Trois-quarts avant, hauteur naturelle"><option>Trois-quarts avant, hauteur naturelle</option><option>Trois-quarts arrière</option><option>Profil latéral</option><option>Vue avant</option><option>Vue arrière</option><option>Vue légèrement plongeante</option></Select></Field>
            <Field label="Format"><Select name="aspectRatio" defaultValue="paysage 3:2"><option>paysage 3:2</option><option>paysage 16:9</option><option>carré 1:1</option><option>portrait 4:5</option></Select></Field>
            <Field label="Décor"><Input name="scene" required defaultValue="Architecture urbaine sobre, parking en béton" /></Field>
            <Field label="Éclairage"><Input name="lighting" required defaultValue="Heure bleue, lumière douce et réaliste" /></Field>
            <Field label="Conditions"><Input name="weather" required defaultValue="Temps calme, sol légèrement humide" /></Field>
            <Field label="Style photographique"><Input name="imageStyle" required defaultValue="Photographie éditoriale automobile premium, naturelle et précise" /></Field>
          </div>
          <Field label="Détails complémentaires"><Textarea name="details" maxLength={500} placeholder="Jantes, toit ouvrant, accessoires visibles, ambiance, cadrage à éviter…" /></Field>
        </div>
        <Button type="submit" disabled={pending} className="mt-5 w-full"><ImagePlus className="size-4" />{pending ? "Préparation…" : "Créer la demande"}</Button>
      </form>
    </section>

    {message.error ? <p role="alert" className="rounded-xl bg-[var(--danger)]/10 px-4 py-3 text-sm text-[var(--danger)]">{message.error}</p> : null}
    {message.success ? <p role="status" className="rounded-xl border border-[var(--accent)]/25 px-4 py-3 text-sm text-[var(--accent)]">{message.success}</p> : null}

    {latestPrompt ? <section className="rounded-2xl bg-[var(--surface)] p-5 sm:p-6"><div className="flex flex-col gap-4 sm:flex-row sm:items-start sm:justify-between"><div><h2 className="text-lg font-medium">Prompt prêt</h2><p className="mt-1 text-sm text-[var(--muted)]">Copie ce texte tel quel dans ton générateur d’images.</p></div><Button type="button" variant="secondary" onClick={() => copyPrompt(latestPrompt)}><Clipboard className="size-4" />Copier le prompt</Button></div><Textarea readOnly value={latestPrompt} className="mt-5 min-h-64 leading-6" /></section> : null}

    <section className="grid gap-6 xl:grid-cols-[.8fr_1.2fr]">
      <form onSubmit={applyOwnPhoto} className="rounded-2xl bg-[var(--surface)] p-5 sm:p-6">
        <h2 className="text-lg font-medium">Utiliser ma propre photo</h2>
        <p className="mt-2 text-sm leading-6 text-[var(--muted)]">Ton fichier reste prioritaire. JPG, PNG ou WebP, 5 Mo maximum.</p>
        <div className="mt-5 space-y-4"><Field label="Fichier"><Input name="photo" type="file" accept="image/jpeg,image/png,image/webp" /></Field><Field label="Ou URL de l’image"><Input name="photoUrl" type="url" placeholder="https://…" /></Field></div>
        <Button type="submit" variant="outline" disabled={pending} className="mt-5 w-full"><Upload className="size-4" />Appliquer cette photo</Button>
      </form>

      <section className="overflow-hidden rounded-2xl bg-[var(--surface)]">
        <header className="border-b border-[var(--line-soft)] px-5 py-4 sm:px-6"><h2 className="text-lg font-medium">Demandes enregistrées</h2><p className="mt-1 text-sm text-[var(--muted)]">{vehicleRequests.length} demande{vehicleRequests.length > 1 ? "s" : ""} pour ce véhicule</p></header>
        {vehicleRequests.length ? <div className="divide-y divide-[var(--line-soft)]">{vehicleRequests.map((request) => <article key={request.id} className="p-5 sm:p-6"><div className="flex flex-col gap-3 sm:flex-row sm:items-start sm:justify-between"><div><div className="flex flex-wrap items-center gap-2"><p className="font-medium">{request.color} · {request.angle}</p><span className={request.status === "COMPLETED" ? "rounded-md border border-[var(--accent)]/35 px-2 py-1 text-[10px] uppercase tracking-[.08em] text-[var(--accent)]" : "rounded-md border border-dashed border-[var(--warning)]/45 px-2 py-1 text-[10px] uppercase tracking-[.08em] text-[var(--warning)]"}>{request.status === "COMPLETED" ? "Image ajoutée" : "À générer"}</span></div><p className="mt-1 text-xs text-[var(--quiet)]">{new Intl.DateTimeFormat("fr-FR", { dateStyle: "medium", timeStyle: "short" }).format(new Date(request.createdAt))} · {request.scene}</p></div><Button type="button" size="sm" variant="ghost" onClick={() => copyPrompt(request.prompt)}><Clipboard className="size-3.5" />Copier</Button></div><details className="mt-4"><summary className="cursor-pointer text-sm text-[var(--muted)]">Voir le prompt et ajouter le résultat</summary><Textarea readOnly value={request.prompt} className="mt-4 min-h-56 leading-6" />{request.status !== "COMPLETED" ? <form onSubmit={(event) => completeRequest(event, request.id)} className="mt-4 grid gap-3 sm:grid-cols-[1fr_1fr_auto]"><Input name="result" type="file" accept="image/jpeg,image/png,image/webp" aria-label="Fichier généré" /><Input name="resultUrl" type="url" placeholder="Ou URL du résultat" aria-label="URL du résultat" /><Button type="submit" disabled={pending}><Check className="size-4" />Ajouter</Button></form> : null}</details></article>)}</div> : <p className="px-5 py-10 text-center text-sm text-[var(--muted)]">Aucune demande. Prépare ton premier prompt avec le formulaire ci-dessus.</p>}
      </section>
    </section>
  </div>;
}

function Field({ label, children }: { label: string; children: React.ReactNode }) {
  const child = isValidElement<{ id?: string; name?: string }>(children) ? children : null;
  const id = child?.props.id ?? child?.props.name;
  const control = child && id ? cloneElement(child, { id }) : children;
  return <div><Label htmlFor={id}>{label}</Label>{control}</div>;
}
