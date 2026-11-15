// src/components/fuel/station-search.tsx
"use client";
import { useRef, useState } from "react";
import { MapPin, LoaderCircle } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Field } from "@/components/forms/field";
import { Input } from "@/components/ui/input";
import { Select } from "@/components/ui/select";
import { TrendChart } from "@/components/dashboard/trend-chart";
import { FUELS } from "@/lib/fuel-types";
import { formatCurrency, formatDate } from "@/lib/format";

type Station = { id: string; address: string; city: string; postalCode: string; distance: number | null; price: number | null; availabilityUncertain: boolean; stale: boolean; declaredAt: string | null; lastSeenAt: string; outage: { type: string; startedAt: string } | null; estimatedFill: number | null };
type Details = { history: { date: string; value: number; observedAt: string }[]; comparisons: { date: string; paid: number; official: number | null; difference: number | null }[] };
const dateLabel = (value: string) => new Intl.DateTimeFormat("fr-FR", { timeZone: "Europe/Paris", dateStyle: "short", timeStyle: "short" }).format(new Date(value));
export function StationSearch({ vehicleId }: { vehicleId: string }) {
  const [stations, setStations] = useState<Station[]>([]), [message, setMessage] = useState(""), [pending, setPending] = useState(false), [fuel, setFuel] = useState("1"), [details, setDetails] = useState<Details | null>(null), [selected, setSelected] = useState<string | null>(null), [detailPending, setDetailPending] = useState(false);
  const [position, setPosition] = useState<{ lat: number; lon: number } | null>(null), [locating, setLocating] = useState(false), [area, setArea] = useState("");
  const searchController = useRef<AbortController | null>(null), detailController = useRef<AbortController | null>(null);
  async function search(event: React.FormEvent<HTMLFormElement>) {
    event.preventDefault(); searchController.current?.abort(); const controller = new AbortController(); searchController.current = controller;
    const data = new FormData(event.currentTarget), params = new URLSearchParams({ area, fuel, radius: String(data.get("radius")), liters: String(data.get("liters")) });
    if (position) { params.set("lat", String(position.lat)); params.set("lon", String(position.lon)); }
    setPending(true); setMessage(""); setDetails(null); setSelected(null); detailController.current?.abort();
    try { const response = await fetch(`/api/fuel-stations?${params}`, { signal: AbortSignal.any([controller.signal, AbortSignal.timeout(20_000)]) }), result = await response.json(); if (!response.ok) throw new Error(result.error ?? "Recherche impossible."); setStations(result.stations); setMessage(`${result.total} stations trouvées${result.total > 50 ? " · les 50 moins chères affichées" : ""}. Dernier import réussi : ${result.sync?.completedAt ? dateLabel(result.sync.completedAt) : "aucun"}.${result.sync?.status === "FAILED" ? " Le dernier import a échoué ; les prix conservés restent consultables." : ""}`); }
    catch (error) { if (!controller.signal.aborted) { setStations([]); setMessage(error instanceof Error ? error.message : "Recherche impossible."); } }
    finally { if (searchController.current === controller) setPending(false); }
  }
  function locate() {
    if (!navigator.geolocation) { setMessage("Géolocalisation indisponible : indiquez une ville ou un code postal."); return; }
    setLocating(true);
    navigator.geolocation.getCurrentPosition(p => { setPosition({ lat: p.coords.latitude, lon: p.coords.longitude }); setArea(""); setLocating(false); }, () => { setMessage("Position non disponible : indiquez une ville ou un code postal."); setLocating(false); }, { timeout: 10_000, maximumAge: 60_000 });
  }
  async function inspect(station: Station) {
    detailController.current?.abort(); const controller = new AbortController(); detailController.current = controller; setSelected(station.id); setDetails(null); setDetailPending(true);
    try { const response = await fetch(`/api/fuel-stations/${station.id}?fuel=${fuel}&vehicle=${encodeURIComponent(vehicleId)}`, { signal: AbortSignal.any([controller.signal, AbortSignal.timeout(20_000)]) }), result = await response.json(); if (!response.ok) throw new Error(result.error); setDetails(result); }
    catch (error) { if (!controller.signal.aborted) setMessage(error instanceof Error ? error.message : "Historique indisponible."); }
    finally { if (detailController.current === controller) setDetailPending(false); }
  }
  return <div className="space-y-5 p-5 sm:p-6"><form onSubmit={search} className="space-y-4"><div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-4"><Field label="Ville, adresse ou code postal"><Input value={area} onChange={e => { setArea(e.target.value); setPosition(null); }} maxLength={100} placeholder="Paris, 75012…" /></Field><Field label="Carburant"><Select value={fuel} onChange={e => { setFuel(e.target.value); setStations([]); setDetails(null); }}>{Object.entries(FUELS).map(([id, label]) => <option key={id} value={id}>{label}</option>)}</Select></Field><Field label="Rayon autour de la position (km)"><Input name="radius" type="number" min="1" max="100" defaultValue="10" required /></Field><Field label="Volume du prochain plein (L)"><Input name="liters" type="number" min="0.1" max="2000" step="0.1" defaultValue="40" required /></Field></div><div className="flex flex-wrap items-center gap-3"><Button disabled={pending}>{pending ? <LoaderCircle className="size-4 animate-spin" /> : null}{pending ? "Recherche…" : "Comparer les stations"}</Button><Button variant="outline" type="button" disabled={locating} onClick={locate}><MapPin className="size-4" />{locating ? "Localisation…" : "Utiliser ma position"}</Button>{position ? <span className="text-xs text-[var(--muted)]">Position obtenue · recherche à vol d’oiseau</span> : null}</div></form>
    <p className="max-w-prose text-xs leading-5 text-[var(--muted)]">Prix déclarés sur le site officiel français. Une publication du flux ne signifie pas que chaque prix a été actualisé. Le coût du prochain plein est une estimation au volume choisi, hors trajet. Les prix des carburants en rupture restent visibles mais sont exclus de cette estimation.</p>
    {message ? <p role="status" className="text-sm text-[var(--muted)]">{message}</p> : null}
    <div className="divide-y divide-[var(--line-soft)]">{stations.map(s => <article key={s.id} className="flex flex-wrap items-start justify-between gap-4 py-4"><div className="min-w-0 flex-1"><h3 className="text-sm font-medium">{s.city} · {s.postalCode}</h3><p className="mt-1 break-words text-sm text-[var(--muted)]">{s.address}{s.distance !== null ? ` · ${s.distance.toFixed(1)} km` : ""}</p><p className="mt-2 text-xs text-[var(--muted)]">Station officielle {s.id} · Déclaration {s.declaredAt ? dateLabel(s.declaredAt) : "indisponible"}</p>{s.outage ? <p className="mt-2 text-sm text-[var(--warning)]">{s.outage.type === "definitive" ? "Non distribué" : s.outage.type === "temporaire" ? "Rupture temporaire" : "Rupture · type non précisé"} depuis le {dateLabel(s.outage.startedAt)}</p> : null}{s.availabilityUncertain ? <p className="mt-2 text-xs text-[var(--warning)]">Disponibilité incertaine : la source contient une date de rupture invalide.</p> : null}{s.stale ? <p className="mt-1 text-xs text-[var(--warning)]">Déclaration ancienne : prix à vérifier sur place.</p> : null}</div><div className="space-y-2 text-right"><p className="font-medium">{s.price === null ? "—" : `${s.price.toFixed(3)} €/L`}</p><p className="text-xs text-[var(--muted)]">Plein estimé : {s.estimatedFill === null ? "indisponible" : formatCurrency(s.estimatedFill)}</p><Button variant="ghost" type="button" onClick={() => inspect(s)}>Historique et comparaison</Button></div></article>)}</div>
    {selected ? <section aria-busy={detailPending} className="space-y-4 border-t border-[var(--line)] pt-5"><h3 className="font-medium">Station {selected} · {FUELS[fuel]}</h3>{detailPending ? <p role="status" className="text-sm text-[var(--muted)]">Chargement de l’historique…</p> : null}{details ? <><TrendChart data={details.history.map(h => ({ label: dateLabel(h.date), value: h.value }))} label="Prix officiel déclaré" unit="€/L" decimals={3} /><p className="text-xs text-[var(--muted)]">Déclarations conservées depuis le premier import Drivio, jusqu’aux 300 dernières. Les dates correspondent aux déclarations officielles. Pour vos pleins, la comparaison retient la dernière déclaration antérieure à la date saisie ; heure exacte du passage inconnue.</p><h4 className="text-sm font-medium">Vos pleins liés à cette station et ce carburant</h4>{details.comparisons.length ? <div className="overflow-x-auto"><table className="w-full min-w-[420px] text-left text-sm"><thead><tr className="text-[var(--muted)]"><th className="py-2">Date</th><th>Payé / L</th><th>Officiel / L</th><th>Écart / L</th></tr></thead><tbody>{details.comparisons.map((c, i) => <tr key={i} className="border-t border-[var(--line-soft)]"><td className="py-3">{formatDate(new Date(c.date))}</td><td>{c.paid.toFixed(3)} €</td><td>{c.official === null ? "Indisponible" : `${c.official.toFixed(3)} €`}</td><td>{c.difference === null ? "—" : `${c.difference.toFixed(3)} €`}</td></tr>)}</tbody></table></div> : <p className="text-sm text-[var(--muted)]">Aucun plein lié. Renseignez l’identifiant officiel et le carburant dans le formulaire de plein.</p>}</> : null}</section> : null}
  </div>;
}





