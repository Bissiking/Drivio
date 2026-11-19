"use client";
import { useState } from "react";
import { useRouter } from "next/navigation";
import { Field } from "./field";
import { Select } from "@/components/ui/select";
import { Button } from "@/components/ui/button";
export function ThemePreferences({ mode, palette }: { mode: string; palette: string }) {
  const [selectedMode, setMode] = useState(mode), [selectedPalette, setPalette] = useState(palette);
  const [pending, setPending] = useState(false), [message, setMessage] = useState("");
  const router = useRouter();
  async function save(event: React.FormEvent) {
    event.preventDefault(); setPending(true); setMessage("");
    try {
      const response = await fetch("/api/preferences/theme", { method: "PATCH", headers: { "content-type": "application/json" }, body: JSON.stringify({ mode: selectedMode, palette: selectedPalette }), signal: AbortSignal.timeout(30000) });
      const data = await response.json(); if (!response.ok) throw new Error(data.error ?? "Le thème n’a pas pu être enregistré.");
      document.documentElement.dataset.theme = selectedMode; document.documentElement.dataset.palette = selectedPalette;
      setMessage("Apparence enregistrée."); router.refresh();
    } catch (error) { setMessage(error instanceof Error ? error.message : "Le service est indisponible."); }
    finally { setPending(false); }
  }
  return <form aria-label="Apparence" className="space-y-5" onSubmit={save}><div className="grid gap-4 sm:grid-cols-2"><Field label="Luminosité"><Select value={selectedMode} onChange={e => setMode(e.target.value)}><option value="dark">Sombre</option><option value="light">Clair</option><option value="auto">Automatique · selon votre système</option></Select></Field><Field label="Palette"><Select value={selectedPalette} onChange={e => setPalette(e.target.value)}><option value="copper">Cuivre · identité Drivio</option><option value="slate">Ardoise · accent bleu</option></Select></Field></div><p className="text-sm text-[var(--muted)]">Le mode automatique suit les changements de votre système. Votre préférence est conservée sur votre compte.</p><Button disabled={pending} type="submit">{pending ? "Enregistrement…" : "Appliquer l’apparence"}</Button>{message ? <p role="status" className="text-sm">{message}</p> : null}</form>;
}
