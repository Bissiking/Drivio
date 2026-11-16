// src/components/fuel/fuel-ledger.tsx
import { fuelIntervals, type FuelPoint, type Money } from "@/lib/analytics";
import { formatCurrency, formatDate, formatNumber } from "@/lib/format";

type Entry = FuelPoint & { id: string; unitPrice: Money };
type Interval = ReturnType<typeof fuelIntervals>[number];

export function FuelLedger({ entries, intervals }: { entries: Entry[]; intervals: Interval[] }) {
  const byEntry = new Map(intervals.filter(i => i.entryId).map(i => [i.entryId, i]));
  const rows = entries.toReversed().slice(0, 100);
  const headings = ["Date du plein", "Compteur", "Volume ajouté", "Montant payé", "Prix/L", "Distance depuis le passage précédent", "Trajet calculé entre pleins complets", "Consommation du trajet", "Coût estimé / 100 km"];
  return <div className="overflow-x-auto"><table className="w-full min-w-[1080px] text-left text-sm">
    <caption className="sr-only">Les consommations concernent les trajets terminés à la date du plein de la ligne. Le trajet après le dernier plein complet reste en cours.</caption>
    <thead><tr className="border-b border-[var(--line-soft)] text-xs text-[var(--quiet)]">{headings.map((title, index) => <th key={title} scope="col" className={`px-5 py-3 font-medium ${index && index !== 6 ? "text-right" : ""}`}>{title}</th>)}</tr></thead>
    <tbody className="divide-y divide-[var(--line-soft)]">{rows.map(entry => {
      const interval = byEntry.get(entry.id);
      const completed = interval?.consumption != null && interval.periodStart != null;
      const unavailable = entry.isFull ? "Données insuffisantes ou incohérentes" : "En attente d’un plein complet";
      return <tr key={entry.id}>
        <td className="px-5 py-4 text-[var(--muted)]">{formatDate(entry.date)}{!entry.isFull ? <span className="mt-1 block text-xs text-[var(--quiet)]">Appoint partiel</span> : null}</td>
        <td className="px-5 py-4 text-right">{formatNumber(entry.mileage, " km")}</td>
        <td className="px-5 py-4 text-right">{formatNumber(Number(entry.liters), " L")}</td>
        <td className="px-5 py-4 text-right">{formatCurrency(Number(entry.totalPrice))}</td>
        <td className="px-5 py-4 text-right text-[var(--muted)]">{formatCurrency(Number(entry.unitPrice))}</td>
        <td className="px-5 py-4 text-right">{interval?.distance != null ? formatNumber(interval.distance, " km") : "—"}</td>
        <td className="px-5 py-4">{completed ? <><span className="block whitespace-nowrap">Du {formatDate(interval.periodStart!)}<br />au {formatDate(interval.date)}</span><span className="mt-1 block text-xs text-[var(--muted)]">{formatNumber(interval.reliableDistance!, " km")} entre pleins complets</span></> : <span className="text-xs text-[var(--muted)]">{unavailable}</span>}</td>
        <td className="px-5 py-4 text-right">{completed ? formatNumber(interval.consumption!, " L/100 km") : "—"}</td>
        <td className="px-5 py-4 text-right">{interval?.costPer100 != null ? formatCurrency(interval.costPer100) : "—"}</td>
      </tr>;
    })}</tbody>
  </table>{!entries.length ? <p className="px-5 py-10 text-sm text-[var(--muted)]">Enregistrez un premier plein complet, puis le suivant pour calculer la consommation du trajet entre les deux.</p> : null}</div>;
}
