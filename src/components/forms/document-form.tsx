"use client";
import { useId, useRef, useState } from "react";
import { useRouter } from "next/navigation";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Select } from "@/components/ui/select";
import { Textarea } from "@/components/ui/textarea";
import { toDateInput } from "@/lib/format";
export function DocumentForm({ vehicleId }: { vehicleId: string }) {
  const router = useRouter(), ref = useRef<HTMLFormElement>(null), id = useId();
  const [pending, setPending] = useState(false), [message, setMessage] = useState("");
  async function submit(event: React.FormEvent<HTMLFormElement>) {
    event.preventDefault(); const body = new FormData(event.currentTarget); setPending(true); setMessage("");
    try { const response = await fetch("/api/documents", { method: "POST", body }); const data = await response.json(); if (!response.ok) throw new Error(data.error ?? "Téléversement impossible."); ref.current?.reset(); setMessage("Document ajouté."); router.refresh(); }
    catch (error) { setMessage(error instanceof Error ? error.message : "Téléversement impossible."); }
    finally { setPending(false); }
  }
  return <form ref={ref} onSubmit={submit} className="space-y-5"><input type="hidden" name="vehicleId" value={vehicleId} /><div className="grid gap-4 sm:grid-cols-2"><div><Label htmlFor={`${id}-title`}>Titre</Label><Input id={`${id}-title`} name="title" required minLength={2} maxLength={100} /></div><div><Label htmlFor={`${id}-category`}>Catégorie</Label><Select id={`${id}-category`} name="category">{[["ACHAT", "Facture d’achat"], ["ENTRETIEN", "Entretien"], ["CONTROLE_TECHNIQUE", "Contrôle technique"], ["ASSURANCE", "Assurance"], ["CONSTRUCTEUR", "Constructeur"], ["AUTRE", "Autre"]].map(([value, label]) => <option key={value} value={value}>{label}</option>)}</Select></div><div><Label htmlFor={`${id}-date`}>Date</Label><Input id={`${id}-date`} name="date" type="date" defaultValue={toDateInput()} required /></div><div><Label htmlFor={`${id}-file`}>Fichier (10 Mo maximum)</Label><Input id={`${id}-file`} name="file" type="file" accept="application/pdf,image/jpeg,image/png,image/webp" required /></div></div><div><Label htmlFor={`${id}-description`}>Description</Label><Textarea id={`${id}-description`} name="description" maxLength={500} /></div>{message ? <p role="status" className="text-sm">{message}</p> : null}<Button disabled={pending}>{pending ? "Téléversement…" : "Ajouter le document"}</Button></form>;
}
