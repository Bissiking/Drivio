// src/components/forms/fuel-modal.tsx
"use client";
import { useEffect, useRef } from "react";
import { X, Fuel } from "lucide-react";
import { FuelForm } from "./fuel-form";
import { Button } from "@/components/ui/button";

type Vehicle = { id: string; brand: string; model: string };
export function FuelModal({ vehicles, automatic = false, mobile = false, desktop = false }: { vehicles: Vehicle[]; automatic?: boolean; mobile?: boolean; desktop?: boolean }) {
  const dialog = useRef<HTMLDialogElement>(null), requested = useRef(false);
  useEffect(() => {
    if (!automatic || requested.current || !vehicles.length || (!mobile && !desktop)) return;
    requested.current = true;
    const isMobile = window.matchMedia("(max-width: 767px)").matches || (window.matchMedia("(pointer: coarse)").matches && window.matchMedia("(max-width: 1023px)").matches);
    void fetch("/api/preferences/fuel-prompt", { method: "POST", headers: { "content-type": "application/json" }, body: JSON.stringify({ device: isMobile ? "mobile" : "desktop" }) })
      .then(async response => { if (response.ok && (await response.json()).open && dialog.current && !dialog.current.open) dialog.current.showModal(); }).catch(() => { /* Automatic prompting never blocks the app. */ });
  }, [automatic, mobile, desktop, vehicles.length]);
  if (!vehicles.length) return null;
  return <>{!automatic ? <Button type="button" variant="outline" onClick={() => dialog.current?.showModal()}><Fuel className="size-4" />Ouvrir le formulaire en fenêtre</Button> : null}
    <dialog ref={dialog} aria-labelledby={automatic ? "auto-fuel-title" : "manual-fuel-title"} onClick={e => { if (e.target === e.currentTarget) dialog.current?.close(); }} className="fuel-dialog m-auto max-h-[90dvh] w-[calc(100%-2rem)] max-w-3xl overflow-y-auto rounded-2xl bg-[var(--surface-raised)] p-5 text-[var(--text)] sm:p-7">
      <div className="mb-6 flex items-start justify-between gap-4"><div><h2 id={automatic ? "auto-fuel-title" : "manual-fuel-title"} className="text-xl font-medium">Enregistrer un plein</h2><p className="mt-2 text-sm text-[var(--muted)]">À la pompe ou de retour chez vous, complétez votre registre.</p></div><Button type="button" variant="ghost" aria-label="Fermer le formulaire" onClick={() => dialog.current?.close()}><X className="size-5" /></Button></div>
      <FuelForm vehicles={vehicles} /><p className="mt-5 text-xs text-[var(--muted)]">Échap ou le bouton Fermer permettent de revenir à l’application.</p>
    </dialog></>;
}

