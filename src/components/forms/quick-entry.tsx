"use client";
import { createContext, useCallback, useContext, useEffect, useRef, useState } from "react";
import { usePathname, useSearchParams } from "next/navigation";
import Link from "next/link";
import { ArrowLeft, ArrowRight, Fuel, Gauge, ReceiptText } from "lucide-react";
import { EntryDialog } from "./entry-dialog";
import { FuelForm } from "./fuel-form";
import { MileageForm } from "./mileage-form";
import { ExpenseForm } from "./expense-form";
import { Button } from "@/components/ui/button";

type EntryKind = "mileage" | "fuel" | "expense";
type View = EntryKind | "choose" | null;
export type EntryVehicle = { id: string; brand: string; model: string };
const actions = [
  { kind: "mileage", title: "Kilométrage", description: "Enregistrer le compteur et la date du relevé.", icon: Gauge },
  { kind: "fuel", title: "Plein de carburant", description: "Noter les litres, le montant et le compteur.", icon: Fuel },
  { kind: "expense", title: "Dépense", description: "Conserver un paiement et sa catégorie.", icon: ReceiptText },
] as const;
const titles = { choose: "Que souhaitez-vous ajouter ?", mileage: "Ajouter un kilométrage", fuel: "Enregistrer un plein", expense: "Ajouter une dépense" };
const QuickEntry = createContext<{ open: (kind?: EntryKind, vehicleId?: string) => void; canAdd: boolean } | null>(null);
export function useQuickEntry() {
  const context = useContext(QuickEntry);
  if (!context) throw new Error("La saisie rapide nécessite le contexte du registre.");
  return context;
}

export function QuickEntryProvider({ vehicles, mobile, desktop, children }: { vehicles: EntryVehicle[]; mobile: boolean; desktop: boolean; children: React.ReactNode }) {
  const [view, setView] = useState<View>(null), [lastView, setLastView] = useState<Exclude<View, null>>("choose");
  const [drafts, setDrafts] = useState<Partial<Record<EntryKind, { vehicleId: string; generation: number; fresh?: boolean }>>>({});
  const [saved, setSaved] = useState(""), [busy, setBusy] = useState(false);
  const current = useRef<View>(null), automaticRequested = useRef(false), automaticDue = useRef(false);
  const manualFuelSeen = useRef(false);
  const pathname = usePathname(), search = useSearchParams(), selected = search.get("vehicle"), editing = search.has("edit");
  const currentPath = useRef(pathname);
  const activate = useCallback((next: Exclude<View, null>, vehicleId?: string) => {
    if (!vehicles.length) return;
    if (next !== "choose") {
      const requested = vehicleId ?? selected;
      const fallback = requested ? (vehicles.some(vehicle => vehicle.id === requested) ? requested : "") : vehicles[0].id;
      setDrafts(previous => previous[next] && !previous[next].fresh ? previous : { ...previous, [next]: { vehicleId: fallback, generation: previous[next]?.generation ?? 0 } });
    }
    current.current = next; setLastView(next); setView(next);
  }, [vehicles, selected]);
  const open = useCallback((kind?: EntryKind, vehicleId?: string) => {
    if (kind === "fuel") {
      manualFuelSeen.current = true; automaticDue.current = false;
      const isMobile = window.matchMedia("(max-width: 767px)").matches || (window.matchMedia("(pointer: coarse)").matches && window.matchMedia("(max-width: 1023px)").matches);
      if (!automaticRequested.current && (isMobile ? mobile : desktop)) {
        automaticRequested.current = true;
        void fetch("/api/preferences/fuel-prompt", { method: "POST", headers: { "content-type": "application/json" }, body: JSON.stringify({ device: isMobile ? "mobile" : "desktop" }) }).catch(() => {});
      }
    }
    setSaved(""); activate(kind ?? "choose", vehicleId);
  }, [activate, mobile, desktop]);
  const close = useCallback(() => {
    current.current = null; setView(null);
    if (automaticDue.current) {
      automaticDue.current = false;
      // Let the native close event and focus restoration finish before opening.
      window.setTimeout(() => activate("fuel"), 0);
    }
  }, [activate]);
  useEffect(() => {
    if (currentPath.current !== pathname) {
      currentPath.current = pathname;
      document.querySelector<HTMLDialogElement>(".entry-dialog[open]")?.close();
    }
  }, [pathname]);
  useEffect(() => {
    if (automaticRequested.current || !vehicles.length || view || editing || (!mobile && !desktop)) return;
    const isMobile = window.matchMedia("(max-width: 767px)").matches || (window.matchMedia("(pointer: coarse)").matches && window.matchMedia("(max-width: 1023px)").matches);
    if (!(isMobile ? mobile : desktop)) return;
    const timer = window.setTimeout(() => {
      if (current.current || document.querySelector("dialog[open]")) return;
      automaticRequested.current = true;
      void fetch("/api/preferences/fuel-prompt", { method: "POST", headers: { "content-type": "application/json" }, body: JSON.stringify({ device: isMobile ? "mobile" : "desktop" }) })
        .then(async response => {
          if (!response.ok || !(await response.json()).open) return;
          if (manualFuelSeen.current || current.current === "fuel") return;
          if (current.current || document.querySelector("dialog[open]")) automaticDue.current = true;
          else activate("fuel");
        }).catch(() => { /* Automatic prompting never blocks manual entry. */ });
    }, 350);
    return () => window.clearTimeout(timer);
  }, [mobile, desktop, vehicles.length, view, editing, activate]);
  function success(kind: EntryKind) {
    if (kind === "fuel") automaticDue.current = false;
    setDrafts(previous => ({ ...previous, [kind]: { vehicleId: selected && vehicles.some(vehicle => vehicle.id === selected) ? selected : vehicles[0]?.id ?? "", generation: (previous[kind]?.generation ?? 0) + 1, fresh: true } }));
    setSaved("Enregistrement ajouté à votre registre.");
    current.current = null; setView(null);
  }
  return <QuickEntry.Provider value={{ open, canAdd: vehicles.length > 0 }}>
    {children}
    {saved ? <div role="status" className="entry-notice"><span>{saved}</span><button type="button" onClick={() => setSaved("")} aria-label="Fermer la confirmation">Fermer</button></div> : null}
    <EntryDialog open={view !== null && vehicles.length > 0} title={titles[lastView]} onClose={close} busy={busy}>
      <div hidden={lastView !== "choose"}><QuickEntryActions compact /><Link className="mt-5 inline-flex min-h-11 items-center gap-2 text-sm text-[var(--accent)]" href="/ajouter" onClick={close}>Ouvrir la page Ajouter <ArrowRight className="size-4" /></Link></div>
      {actions.map(({ kind }) => <section key={kind} hidden={lastView !== kind} aria-label={titles[kind]}>
        <Button type="button" variant="ghost" className="mb-5" disabled={busy} onClick={() => activate("choose")}><ArrowLeft className="size-4" />Choisir une autre saisie</Button>
        {drafts[kind] ? <div key={`${kind}-${drafts[kind].generation}-${drafts[kind].vehicleId}-${vehicles.map(vehicle => vehicle.id).join(",")}`}>
          {kind === "fuel" ? <FuelForm vehicles={vehicles} defaultVehicleId={drafts[kind].vehicleId} onSuccess={() => success(kind)} onPendingChange={setBusy} /> : kind === "mileage" ? <MileageForm vehicles={vehicles} defaultVehicleId={drafts[kind].vehicleId} onSuccess={() => success(kind)} onPendingChange={setBusy} /> : <ExpenseForm vehicles={vehicles} defaultVehicleId={drafts[kind].vehicleId} onSuccess={() => success(kind)} onPendingChange={setBusy} />}
        </div> : null}
        <p className="mt-5 text-xs leading-5 text-[var(--muted)]">Fermer conserve ce brouillon dans cet onglet. Il sera effacé après enregistrement ou rechargement de la page.</p>
      </section>)}
    </EntryDialog>
  </QuickEntry.Provider>;
}

export function QuickEntryActions({ compact = false, vehicleId }: { compact?: boolean; vehicleId?: string }) {
  const { open, canAdd } = useQuickEntry();
  return <div className={compact ? "entry-actions" : "entry-actions entry-actions-page"}>
    {actions.map(({ kind, title, description, icon: Icon }) => <button type="button" key={kind} disabled={!canAdd} aria-haspopup="dialog" onClick={() => open(kind, vehicleId)} className="entry-action" data-entry={kind}>
      <Icon className="size-6 shrink-0 text-[var(--accent)]" strokeWidth={1.6} /><span className="min-w-0 flex-1"><strong>{title}</strong><span>{description}</span></span><ArrowRight className="size-4 shrink-0 text-[var(--quiet)]" />
    </button>)}
    {!canAdd ? <p className="py-4 text-sm leading-6 text-[var(--muted)]">La saisie nécessite un véhicule actif avec un droit de modification. Vos véhicules partagés en lecture restent consultables.</p> : null}
  </div>;
}
