"use client";
import { useState } from "react";
import { useRouter } from "next/navigation";
import { type ExperiencePreferences as Preferences } from "@/lib/experience";
import { Button } from "@/components/ui/button";
import { Field } from "./field";
import { Select } from "@/components/ui/select";

export function ExperiencePreferences({ homePage, interfaceStyle }: Preferences) {
  const [home, setHome] = useState(homePage), [style, setStyle] = useState(interfaceStyle);
  const [pending, setPending] = useState(false), [message, setMessage] = useState("");
  const router = useRouter();
  async function save(event: React.FormEvent) {
    event.preventDefault(); setPending(true); setMessage("");
    try {
      const response = await fetch("/api/preferences/experience", { method: "PATCH", headers: { "content-type": "application/json" }, body: JSON.stringify({ homePage: home, interfaceStyle: style }), signal: AbortSignal.timeout(30000) });
      const data = await response.json();
      if (!response.ok) throw new Error(data.error ?? "Les préférences n’ont pas pu être enregistrées.");
      setMessage("Accueil et interface enregistrés."); router.refresh();
    } catch (error) { setMessage(error instanceof Error ? error.message : "Le service est indisponible."); }
    finally { setPending(false); }
  }
  return <form onSubmit={save} className="space-y-5" aria-label="Accueil et interface">
    <div className="grid gap-5 sm:grid-cols-2">
      <Field label="Page d’accueil"><Select name="homePage" value={home} onChange={event => setHome(event.target.value as Preferences["homePage"])}><option value="auto">Automatique · selon l’ouverture</option><option value="dashboard">Dashboard</option><option value="add">Ajouter</option></Select></Field>
      <Field label="Interface"><Select name="interfaceStyle" value={style} onChange={event => setStyle(event.target.value as Preferences["interfaceStyle"])}><option value="classic">Drivio Classic</option><option value="horizon">Drivio Horizon</option></Select></Field>
    </div>
    <p className="max-w-prose text-sm leading-6 text-[var(--muted)]">Automatique ouvre Dashboard dans le navigateur et Ajouter depuis l’application installée. Un choix explicite s’applique à chaque ouverture de votre accueil.</p>
    <p className="max-w-prose text-sm leading-6 text-[var(--muted)]">Classic conserve votre registre actuel. Horizon met votre véhicule, les prochaines actions et la saisie rapide au premier plan. Vos données et vos droits restent les mêmes.</p>
    <Button type="submit" disabled={pending}>{pending ? "Enregistrement…" : "Enregistrer l’accueil et l’interface"}</Button>
    {message ? <p role="status" className="text-sm">{message}</p> : null}
  </form>;
}
