import Link from "next/link";
import { PageHeader } from "@/components/layout/page-header";
import { Panel } from "@/components/layout/panel";
import { VehiclePicker } from "@/components/layout/vehicle-picker";
import { DocumentForm } from "@/components/forms/document-form";
import { ApiActionButton } from "@/components/forms/api-action-button";
import { requirePageUser } from "@/lib/auth";
import { vehicleWorkspace } from "@/lib/vehicle-workspace";
import { formatDate, formatNumber } from "@/lib/format";
export const metadata = { title: "Documents" };
export default async function DocumentsPage({ searchParams }: { searchParams: Promise<{ vehicle?: string }> }) {
  const user = await requirePageUser(), query = await searchParams;
  const { vehicles, vehicle } = await vehicleWorkspace(user.id, query.vehicle);
  return <div className="space-y-7"><PageHeader title="Documents" description="Factures, contrats et justificatifs de chaque véhicule. Téléchargement réservé à votre compte." /><VehiclePicker vehicles={vehicles} selected={vehicle?.id} href="/documents" />{vehicle ? <><details className="rounded-xl bg-[var(--surface)]" open={!vehicle.documents.length}><summary className="cursor-pointer px-5 py-4 text-sm text-[var(--accent)]">Ajouter un document</summary><div className="border-t border-[var(--line-soft)] p-5"><DocumentForm vehicleId={vehicle.id} /></div></details><Panel title="Dossier véhicule"><div className="divide-y divide-[var(--line-soft)] px-5">{vehicle.documents.map(d => <article key={d.id} className="flex flex-col justify-between gap-4 py-5 sm:flex-row sm:items-center"><div><h2 className="text-sm font-medium">{d.title}</h2><p className="mt-1 text-xs text-[var(--muted)]">{formatDate(d.date)} · {d.category.replaceAll("_", " ")} · {formatNumber(d.size / 1024, " Ko")}</p>{d.description ? <p className="mt-2 max-w-prose text-sm text-[var(--muted)]">{d.description}</p> : null}</div><div className="flex flex-wrap items-center gap-4"><a href={`/api/documents/${d.id}`} className="text-sm text-[var(--accent)]">Télécharger</a><ApiActionButton endpoint={`/api/documents/${d.id}`} method="DELETE" variant="danger" confirmation="Supprimer définitivement ce document et son fichier ?">Supprimer</ApiActionButton></div></article>)}{!vehicle.documents.length ? <p className="py-8 text-sm text-[var(--muted)]">Ajoutez un premier justificatif au dossier de {vehicle.brand} {vehicle.model}.</p> : null}</div></Panel></> : <Link href="/garage" className="text-[var(--accent)]">Ajoutez ou choisissez un véhicule dans le garage.</Link>}</div>;
}
