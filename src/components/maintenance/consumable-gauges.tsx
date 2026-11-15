// src/components/maintenance/consumable-gauges.tsx
import Link from "next/link";
import { Battery, CalendarCheck, CarFront, CircleDot, Cog, Disc, Disc3, Droplet, Droplets, Filter, Link2, Wind, Wrench, Zap, type LucideIcon } from "lucide-react";
import type { MaintenanceGauge } from "@/lib/maintenance-gauges";
import { formatDate, formatNumber } from "@/lib/format";

const icons: Record<string, LucideIcon> = { PNEUS: CircleDot, PLAQUETTES: Disc3, DISQUES: Disc, FREINS: Disc3, BOUGIES: Zap, VIDANGE: Droplet, FILTRES: Filter, DISTRIBUTION: Link2, CONTROLE_TECHNIQUE: CarFront, ENTRETIEN_CONSTRUCTEUR: CalendarCheck, BATTERIE: Battery, LIQUIDE_FREIN: Droplets, ESSUIE_GLACES: Wind, PERSONNALISE: Wrench };
export function MaintenanceIcon({ type, title, className }: { type: string; title: string; className?: string }) {
  const Icon = type === "PERSONNALISE" && /dsg|dq200|bo[iî]te/i.test(title) ? Cog : type === "FILTRES" && /habitacle/i.test(title) ? Wind : icons[type] ?? Wrench;
  return <Icon aria-hidden="true" className={className} strokeWidth={1.7} />;
}
export const gaugeStatus = { OK: "OK", SOON: "À prévoir", OVERDUE: "À contrôler", UNKNOWN: "À renseigner" };
export function gaugeColor(item: MaintenanceGauge) {
  return item.status === "OVERDUE" ? "var(--danger)" : item.status === "SOON" ? "var(--warning)" : item.percent === null ? "var(--quiet)" : "var(--accent)";
}
const position = (angle: number) => ({ x: 72 + 51 * Math.cos(angle * Math.PI / 180), y: 60 + 51 * Math.sin(angle * Math.PI / 180) });
function segment(index: number) {
  const start = position(135 + index * 22.5 + 2), end = position(135 + (index + 1) * 22.5 - 2);
  return `M ${start.x.toFixed(3)} ${start.y.toFixed(3)} A 51 51 0 0 1 ${end.x.toFixed(3)} ${end.y.toFixed(3)}`;
}
export function ConsumableGauge({ item }: { item: MaintenanceGauge }) {
  const value = item.percent === null ? null : item.percent === 0 ? 0 : Math.max(1, Math.round(item.percent));
  const filled = item.percent === null ? 0 : Math.ceil(item.percent / 100 * 12), color = gaugeColor(item);
  const label = `${item.title} : ${value === null ? "référence à renseigner" : `${value} % ${item.isEstimate ? "restants estimés, contrôle manuel nécessaire" : "de l'intervalle restant avant échéance"}`}`;
  return <div role={value === null ? "img" : "meter"} aria-label={label} aria-valuemin={value === null ? undefined : 0} aria-valuemax={value === null ? undefined : 100} aria-valuenow={value ?? undefined} aria-valuetext={value === null ? undefined : label} className="relative mx-auto h-32 w-36 max-w-full" style={{ color }}>
    <svg viewBox="0 0 144 128" className="size-full" aria-hidden="true" fill="none">{Array.from({ length: 12 }, (_, index) => <path key={index} d={segment(index)} stroke={index < filled ? color : "var(--line-soft)"} strokeWidth="10" />)}<text x="20" y="119" fill="var(--quiet)" fontSize="9" textAnchor="middle">0</text><text x="124" y="119" fill="var(--quiet)" fontSize="9" textAnchor="middle">100</text></svg>
    <div aria-hidden="true" className="absolute inset-x-0 top-8 flex flex-col items-center"><MaintenanceIcon type={item.type} title={item.title} className="size-6" /><span className={`mt-2 font-medium tabular-nums ${item.isEstimate ? "text-xl" : "text-2xl"}`}>{value === null ? "—" : `${item.isEstimate ? "≈ " : ""}${value} %`}</span></div>
  </div>;
}
export function ConsumableGauges({ items }: { items: MaintenanceGauge[] }) {
  if (!items.length) return <p className="px-5 py-7 text-sm text-[var(--muted)]">Ajoutez une échéance ou un montage de pneus dans Suivi véhicule pour démarrer les jauges.</p>;
  return <ul className="grid grid-cols-2 overflow-hidden bg-[var(--surface)] sm:grid-cols-3 xl:grid-cols-4">{items.map(item => <li key={item.id} className="min-w-0 border-b border-r border-[var(--line-soft)] bg-[var(--surface)]"><Link href={item.href} className="block h-full px-3 py-4 text-center transition-colors hover:bg-[var(--surface-raised)] sm:px-4"><h3 className="min-h-10 text-sm font-medium leading-5">{item.title}</h3><ConsumableGauge item={item} /><p className="text-xs font-medium" style={{ color: gaugeColor(item) }}>{gaugeStatus[item.status]}</p><p className="mt-2 text-xs text-[var(--muted)]">{item.kmRemaining === null ? "Échéance par date" : `${item.isEstimate ? "≈ " : ""}${formatNumber(Math.max(0, item.kmRemaining), " km")} restants`}</p><p className="mt-1 text-xs text-[var(--muted)]">{item.dueDate ? `${item.dateEstimated ? "≈ " : ""}${formatDate(item.dueDate)}` : "Date non déterminée"}</p>{item.isEstimate ? <p className="mt-2 text-xs leading-4 text-[var(--warning)]">Usure estimée<br />Contrôle manuel nécessaire</p> : <p className="mt-2 text-[10px] text-[var(--quiet)]">Intervalle avant entretien</p>}</Link></li>)}</ul>;
}
