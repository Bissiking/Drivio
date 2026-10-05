// src/app/(app)/garage/page.tsx
import { vehicleImage } from "@/lib/vehicle-images";
import Link from "next/link";
import { PhotoForm } from "@/components/forms/photo-form";
import Image from "next/image";
import type { Metadata } from "next";
import { Check, Plus } from "lucide-react";
import { VehicleForm } from "@/components/forms/vehicle-form";
import { VehicleArchiveForm } from "@/components/forms/vehicle-archive-form";
import { ApiActionButton } from "@/components/forms/api-action-button";
import { PageHeader } from "@/components/layout/page-header";
import { Panel } from "@/components/layout/panel";
import { requirePageUser } from "@/lib/auth";
import { db } from "@/lib/db";
import { formatCurrency, formatDate, formatNumber } from "@/lib/format";

export const metadata: Metadata = { title: "Garage" };

export default async function GaragePage() {
  const user = await requirePageUser();
  const vehicles = await db.vehicle.findMany({ where: { userId: user.id }, orderBy: [{ status: "asc" }, { isPrimary: "desc" }, { createdAt: "desc" }], include: { mileageReadings: { orderBy: { date: "desc" }, take: 1 } } });
  return <div className="space-y-8">
    <PageHeader title="Garage" description="Vos véhicules actifs et archivés, réunis dans un même registre." />
    <details className="group rounded-2xl bg-[var(--surface)]" open={vehicles.length === 0}>
      <summary className="flex cursor-pointer list-none items-center gap-3 px-5 py-4 text-sm font-medium sm:px-6"><Plus className="size-4 text-[var(--accent)]" />Ajouter un véhicule</summary>
      <div className="border-t border-[var(--line-soft)] p-5 sm:p-6"><VehicleForm /></div>
    </details>
    {vehicles.length ? <div className="space-y-5">{vehicles.map((vehicle) => {
      const current = vehicle.mileageReadings[0]?.mileage ?? vehicle.finalMileage ?? vehicle.purchaseMileage;
      const image = vehicleImage(vehicle);
      return <article key={vehicle.id} className="overflow-hidden rounded-2xl bg-[var(--surface)] lg:grid lg:grid-cols-[320px_1fr]">
        <div className="relative min-h-56"><Image src={image.src} alt={image.illustrative ? `Illustration de ${vehicle.brand} ${vehicle.model}` : `${vehicle.brand} ${vehicle.model}`} fill priority={vehicle.isPrimary} unoptimized={Boolean(vehicle.photoUrl && !vehicle.photoPath)} sizes="(max-width:1024px) 100vw, 320px" className="object-cover lg:object-contain" />{image.illustrative ? <span className="absolute bottom-3 left-3 rounded-md bg-[var(--ink)]/90 px-2 py-1 text-[10px] text-[var(--muted)]">Illustration · image générée</span> : null}</div>
        <div className="p-5 sm:p-7"><div className="flex flex-col gap-4 sm:flex-row sm:items-start sm:justify-between"><div><div className="flex flex-wrap items-center gap-2"><h2 className="text-2xl font-medium tracking-[-0.03em]">{vehicle.brand} {vehicle.model}</h2>{vehicle.isPrimary ? <span className="rounded-md border border-[var(--accent)]/35 px-2 py-1 text-[10px] uppercase tracking-[.08em] text-[var(--accent)]">Principal</span> : null}{vehicle.status === "ARCHIVED" ? <span className="rounded-md border border-[var(--line)] px-2 py-1 text-[10px] uppercase tracking-[.08em] text-[var(--muted)]">Archivé</span> : null}</div><p className="mt-2 text-sm text-[var(--muted)]">{vehicle.year} · {vehicle.trim}{vehicle.powertrain ? ` · ${vehicle.powertrain}` : ""}</p></div><p className="text-3xl font-medium tracking-[-0.035em]">{formatNumber(current, " km")}</p></div>
          <dl className="mt-8 grid gap-4 border-y border-[var(--line-soft)] py-5 text-sm sm:grid-cols-3"><div><dt className="text-[var(--quiet)]">Achat</dt><dd className="mt-1">{formatDate(vehicle.purchaseDate)}</dd></div><div><dt className="text-[var(--quiet)]">Kilométrage initial</dt><dd className="mt-1">{formatNumber(vehicle.purchaseMileage, " km")}</dd></div><div><dt className="text-[var(--quiet)]">Prix d’achat</dt><dd className="mt-1">{vehicle.purchasePrice ? formatCurrency(Number(vehicle.purchasePrice)) : "Non renseigné"}</dd></div></dl>
          <div className="mt-5 flex flex-wrap gap-3">{vehicle.status === "ACTIVE" && !vehicle.isPrimary ? <ApiActionButton endpoint={`/api/vehicles/${vehicle.id}`} body={{ action: "primary" }}><Check className="size-3.5" />Définir principal</ApiActionButton> : null}{vehicle.status === "ARCHIVED" ? <ApiActionButton endpoint={`/api/vehicles/${vehicle.id}`} body={{ action: "restore" }}>Restaurer</ApiActionButton> : null}</div>
          <div className="mt-5 flex flex-wrap gap-5 text-sm text-[var(--accent)]"><Link href={`/suivi?vehicle=${vehicle.id}`}>Suivi véhicule</Link><Link href={`/documents?vehicle=${vehicle.id}`}>Documents</Link><Link href={`/statistiques?vehicle=${vehicle.id}`}>Coût et statistiques</Link></div><PhotoForm vehicleId={vehicle.id} />
          {vehicle.status === "ACTIVE" ? <VehicleArchiveForm vehicleId={vehicle.id} currentMileage={current} /> : null}
        </div>
      </article>;
    })}</div> : <Panel className="p-8 text-center text-sm text-[var(--muted)]">Aucun véhicule. Utilisez le formulaire ci-dessus pour ouvrir votre garage.</Panel>}
  </div>;
}
