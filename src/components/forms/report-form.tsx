// src/components/forms/report-form.tsx
"use client";
import { useState } from "react";
import { Download, LoaderCircle } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Field } from "./field";
import { Input } from "@/components/ui/input";
import { Select } from "@/components/ui/select";
import { toDateInput } from "@/lib/format";

const sections = { vehicle: "Véhicule", mileage: "Relevés kilométriques", statistics: "Statistiques", costs: "Coûts", maintenance: "Interventions", schedules: "Échéances" };
const defaults: Record<string, string[]> = { summary: ["vehicle", "statistics", "costs"], maintenance: ["vehicle", "maintenance", "schedules"], sale: ["vehicle", "mileage", "maintenance", "schedules"] };
export function ReportForm({ vehicleId, purchaseDate, documents }: { vehicleId: string; purchaseDate: string; documents: { id: string; date: string; mimeType: string }[] }) {
  const [template, setTemplate] = useState("summary"), [selectedSections, setSections] = useState(defaults.summary), [sensitive, setSensitive] = useState(false), [pending, setPending] = useState(false), [message, setMessage] = useState("");
  async function download(event: React.FormEvent<HTMLFormElement>) {
    event.preventDefault(); setPending(true); setMessage("");
    const data = new FormData(event.currentTarget);
    try {
      const response = await fetch("/api/reports", { method: "POST", headers: { "content-type": "application/json" }, signal: AbortSignal.timeout(60_000), body: JSON.stringify({ vehicleId, template, from: data.get("from"), to: data.get("to"), sections: selectedSections, includeSensitive: sensitive, attachmentIds: data.getAll("attachmentIds") }) });
      if (!response.ok) { const result = await response.json(); throw new Error(result.error ?? "Le rapport n'a pas pu être généré."); }
      const url = URL.createObjectURL(await response.blob()), a = document.createElement("a"); a.href = url; a.download = `drivio-${template}.pdf`; a.click(); setTimeout(() => URL.revokeObjectURL(url), 10_000); setMessage("Rapport généré et prêt à télécharger.");
    } catch (error) { setMessage(error instanceof Error ? error.message : "Génération impossible."); } finally { setPending(false); }
  }
  return <form onSubmit={download} className="space-y-6"><div className="grid gap-4 sm:grid-cols-3"><Field label="Modèle de rapport"><Select value={template} onChange={e => { setTemplate(e.target.value); setSections(defaults[e.target.value]); }}><option value="summary">Synthèse</option><option value="maintenance">Entretien</option><option value="sale">Cession</option></Select></Field><Field label="Début de période"><Input name="from" type="date" defaultValue={purchaseDate} required /></Field><Field label="Fin de période"><Input name="to" type="date" defaultValue={toDateInput()} required /></Field></div>
    <fieldset><legend className="mb-3 text-sm font-medium">Sections à inclure</legend><div className="grid gap-2 sm:grid-cols-2">{Object.entries(sections).map(([key, label]) => <label key={key} className="flex min-h-11 items-center gap-3 text-sm"><input className="size-4 accent-[var(--accent)]" type="checkbox" checked={selectedSections.includes(key)} onChange={e => setSections(e.target.checked ? [...selectedSections, key] : selectedSections.filter(s => s !== key))} />{label}</label>)}</div></fieldset>
    <label className="flex min-h-11 items-start gap-3 text-sm"><input className="mt-1 size-4 shrink-0 accent-[var(--accent)]" type="checkbox" checked={sensitive} onChange={e => setSensitive(e.target.checked)} /><span>Inclure les informations sensibles (immatriculation, VIN, intitulés libres et justificatifs originaux).<span className="mt-1 block text-xs leading-5 text-[var(--muted)]">Désactivé par défaut. Sans cette option, les identifiants et intitulés libres sont masqués ; coordonnées du propriétaire, contrats, notes et noms de fichiers restent exclus.</span></span></label>
    {sensitive && documents.length ? <fieldset><legend className="mb-2 text-sm font-medium">Justificatifs originaux, non masqués</legend><p className="mb-2 text-xs text-[var(--warning)]">Sélectionnez uniquement des pièces vérifiées et datées dans la période. Les originaux peuvent contenir des données personnelles.</p>{documents.map((d, i) => <label key={d.id} className="flex min-h-11 items-center gap-3 text-sm"><input className="size-4 accent-[var(--accent)]" type="checkbox" name="attachmentIds" value={d.id} />Pièce {i + 1} · {d.date} · {d.mimeType === "application/pdf" ? "PDF" : "Image"}</label>)}</fieldset> : null}
    {message ? <p role="status" className="text-sm text-[var(--muted)]">{message}</p> : null}<Button disabled={pending || !selectedSections.length}>{pending ? <LoaderCircle className="size-4 animate-spin" /> : <Download className="size-4" />}{pending ? "Génération du PDF…" : "Télécharger le rapport PDF"}</Button>
  </form>;
}
