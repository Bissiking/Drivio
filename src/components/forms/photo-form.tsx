"use client";
import { useRouter } from "next/navigation";
import { useId, useRef, useState } from "react";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Button } from "@/components/ui/button";
import { ApiActionButton } from "./api-action-button";
export function PhotoForm({ vehicleId }: { vehicleId: string }) {
  const router = useRouter(), ref = useRef<HTMLFormElement>(null), id = useId();
  const [pending, setPending] = useState(false), [message, setMessage] = useState("");
  async function submit(event: React.FormEvent<HTMLFormElement>) {
    event.preventDefault(); const data = new FormData(event.currentTarget); setPending(true); setMessage("");
    try {
      const file = data.get("file"); let photoPath: string | undefined;
      if (file instanceof File && file.size > 0) { const form = new FormData(); form.set("file", file); const response = await fetch("/api/upload", { method: "POST", body: form }); const payload = await response.json(); if (!response.ok) throw new Error(payload.error); photoPath = payload.path; }
      const response = await fetch(`/api/vehicles/${vehicleId}`, { method: "PATCH", headers: { "Content-Type": "application/json" }, body: JSON.stringify({ action: "photo", photoPath, photoUrl: photoPath ? undefined : data.get("photoUrl") || undefined }) });
      const payload = await response.json(); if (!response.ok) throw new Error(payload.error); ref.current?.reset(); router.refresh(); setMessage("Photo mise à jour.");
    } catch (error) { setMessage(error instanceof Error ? error.message : "Photo indisponible."); }
    finally { setPending(false); }
  }
  return <details className="mt-5"><summary className="cursor-pointer py-2 text-sm text-[var(--accent)]">Changer la photo</summary><form ref={ref} onSubmit={submit} className="space-y-4 pt-3"><div><Label htmlFor={`${id}-file`}>Photo personnelle (5 Mo maximum)</Label><Input id={`${id}-file`} type="file" name="file" accept="image/jpeg,image/png,image/webp" /></div><div><Label htmlFor={`${id}-url`}>Ou URL de photo</Label><Input id={`${id}-url`} name="photoUrl" type="url" placeholder="https://…" /></div><div className="flex flex-wrap gap-3"><Button disabled={pending}>{pending ? "Téléversement…" : "Appliquer la photo"}</Button><ApiActionButton endpoint={`/api/vehicles/${vehicleId}`} body={{ action: "photo", reset: true }} confirmation="Retirer la photo active et utiliser l’illustration de catalogue ?">Utiliser l’illustration</ApiActionButton></div>{message ? <p role="status" className="text-sm">{message}</p> : null}</form></details>;
}
