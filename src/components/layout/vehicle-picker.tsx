import Link from "next/link";
export function VehiclePicker({ vehicles, selected, href }: { vehicles: { id: string; brand: string; model: string; status?: string }[]; selected?: string; href: string }) {
  return <nav aria-label="Choisir le véhicule" className="flex flex-wrap gap-2">{vehicles.map(v => <Link key={v.id} href={`${href}${href.includes("?") ? "&" : "?"}vehicle=${v.id}`} aria-current={selected === v.id ? "page" : undefined} className={`rounded-lg border px-3 py-2 text-sm transition ${selected === v.id ? "border-[var(--accent)] bg-[var(--surface)] text-[var(--accent)]" : "border-[var(--line)] text-[var(--muted)] hover:bg-[var(--surface)]"}`}>{v.brand} {v.model}{v.status === "ARCHIVED" ? " · Archivé" : ""}</Link>)}</nav>;
}
