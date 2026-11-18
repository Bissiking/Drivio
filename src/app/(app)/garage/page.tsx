import { OpenSharing } from "@/components/sharing/open-sharing";
import { vehicleWhere, vehicleRights } from "@/lib/vehicle-access";
import { VehiclePermissions } from "@/components/sharing/vehicle-permissions";
import { AccessNotice } from "@/components/sharing/access-notice";
import { SharePanel } from "@/components/sharing/share-panel";
import { Invitations } from "@/components/sharing/invitations";
// src/app/(app)/garage/page.tsx
import { vehicleImage } from "@/lib/vehicle-images";
import Link from "next/link";
import { PhotoForm } from "@/components/forms/photo-form";
import { DrivetrainForm } from "@/components/forms/drivetrain-form";
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
import { drivetrainLabels } from "@/lib/drivetrain";

export const metadata: Metadata = { title: "Garage" };

export default async function GaragePage() {
  const user = await requirePageUser();
  const vehicles = await db.vehicle.findMany({ where: vehicleWhere(user.id), orderBy: [{ status: "asc" }, { isPrimary: "desc" }, { createdAt: "desc" }], include: { shares: true, mileageReadings: { orderBy: { date: "desc" }, take: 1 } } });
  const invitations = user.email ? await db.vehicleShare.findMany({ where: { email: user.email.trim().toLowerCase(), acceptedAt: null, expiresAt: { gt: new Date() }, vehicle: { userId: { not: user.id } } }, include: { vehicle: { select: { brand: true, model: true } } }, orderBy: { createdAt: "desc" } }) : [];
  return <div className="space-y-8">
    <PageHeader title="Garage" description="Vos véhicules actifs et archivés, réunis dans un même registre." />
    <Invitations invitations={invitations} />
    <details className="group rounded-2xl bg-[var(--surface)]" open={vehicles.length === 0 && invitations.length === 0}>
      <summary className="flex cursor-pointer list-none items-center gap-3 px-5 py-4 text-sm font-medium sm:px-6"><Plus className="size-4 text-[var(--accent)]" />Ajouter un véhicule</summary>
      <div className="border-t border-[var(--line-soft)] p-5 sm:p-6"><VehicleForm /></div>
    </details>
    {vehicles.length ? <div className="space-y-5">{vehicles.map((vehicle) => {
      const rights = vehicleRights({ ...vehicle, shares: vehicle.shares.filter(share => share.recipientId === user.id && share.acceptedAt) }, user.id);
      const received = vehicle.shares.find(share => share.recipientId === user.id && share.acceptedAt);
      if (!rights.owner && rights.scope === "SIMPLE") return <article key={vehicle.id} className="space-y-5 rounded-2xl bg-[var(--surface)] p-5 sm:p-7"><h2 className="text-2xl font-medium">{vehicle.brand} {vehicle.model}</h2><AccessNotice {...rights} /><nav className="flex flex-wrap gap-4 text-sm text-[var(--accent)]">{[["dashboard", "Synthèse"], ["carburant", "Carburant"], ["depenses", "Dépenses"], ["kilometrage", "Kilomètres"]].map(([route, label]) => <Link key={route} href={`/${route}?vehicle=${vehicle.id}`}>{label}</Link>)}</nav>{received ? <ApiActionButton endpoint={`/api/shares/${received.id}`} method="DELETE" confirmation="Quitter le partage de ce véhicule ?">Quitter le partage</ApiActionButton> : null}</article>;
      const current = vehicle.mileageReadings[0]?.mileage ?? vehicle.finalMileage ?? vehicle.purchaseMileage;
      const image = vehicleImage(vehicle);
      return <VehiclePermissions key={vehicle.id} canWrite={rights.canWrite}><article id={`vehicle-${vehicle.id}`} key={vehicle.id} className="scroll-mt-6 overflow-hidden rounded-2xl bg-[var(--surface)] lg:grid lg:grid-cols-[320px_1fr]">
        <div className="relative min-h-56"><Image src={image.src} alt={image.illustrative ? `Illustration de ${vehicle.brand} ${vehicle.model}` : `${vehicle.brand} ${vehicle.model}`} fill priority={vehicle.isPrimary} unoptimized={Boolean(vehicle.photoUrl && !vehicle.photoPath)} sizes="(max-width:1024px) 100vw, 320px" className="object-cover lg:object-contain" />{image.illustrative ? <span className="absolute bottom-3 left-3 rounded-md bg-[var(--ink)]/90 px-2 py-1 text-[10px] text-[var(--muted)]">Illustration · image générée</span> : null}</div>
        <div className="p-5 sm:p-7"><div className="flex flex-col gap-4 sm:flex-row sm:items-start sm:justify-between"><div><div className="flex flex-wrap items-center gap-2"><h2 className="text-2xl font-medium tracking-[-0.03em]">{vehicle.brand} {vehicle.model}</h2>{vehicle.isPrimary ? <span className="rounded-md border border-[var(--accent)]/35 px-2 py-1 text-[10px] uppercase tracking-[.08em] text-[var(--accent)]">{rights.owner ? "Principal" : "Principal du propriétaire"}</span> : null}{vehicle.status === "ARCHIVED" ? <span className="rounded-md border border-[var(--line)] px-2 py-1 text-[10px] uppercase tracking-[.08em] text-[var(--muted)]">Archivé</span> : null}</div><p className="mt-2 text-sm text-[var(--muted)]">{vehicle.year} · {vehicle.trim}{vehicle.powertrain ? ` · ${vehicle.powertrain}` : ""}</p></div><div className="sm:text-right"><p className="text-3xl font-medium tracking-[-0.035em]">{formatNumber(current, " km")}</p>{rights.owner ? <OpenSharing vehicleId={vehicle.id} /> : null}</div></div>
          <div className="mt-4"><AccessNotice {...rights} /></div>
          <dl className="mt-8 grid gap-4 border-y border-[var(--line-soft)] py-5 text-sm sm:grid-cols-3"><div><dt className="text-[var(--quiet)]">Achat</dt><dd className="mt-1">{formatDate(vehicle.purchaseDate)}</dd></div><div><dt className="text-[var(--quiet)]">Kilométrage initial</dt><dd className="mt-1">{formatNumber(vehicle.purchaseMileage, " km")}</dd></div><div><dt className="text-[var(--quiet)]">Prix d’achat</dt><dd className="mt-1">{vehicle.purchasePrice ? formatCurrency(Number(vehicle.purchasePrice)) : "Non renseigné"}</dd></div></dl>
          <div className="mt-5 flex flex-wrap gap-3">{rights.owner && vehicle.status === "ACTIVE" && !vehicle.isPrimary ? <ApiActionButton endpoint={`/api/vehicles/${vehicle.id}`} body={{ action: "primary" }}><Check className="size-3.5" />Définir principal</ApiActionButton> : null}{vehicle.status === "ARCHIVED" ? <ApiActionButton endpoint={`/api/vehicles/${vehicle.id}`} body={{ action: "restore" }}>Restaurer</ApiActionButton> : null}</div>
          <p className="mt-4 text-sm text-[var(--muted)]">{drivetrainLabels[vehicle.drivetrain] ?? drivetrainLabels.UNKNOWN}</p>
          {rights.canWrite ? <DrivetrainForm vehicleId={vehicle.id} drivetrain={vehicle.drivetrain} /> : null}
          <div className="mt-5 flex flex-wrap gap-5 text-sm text-[var(--accent)]"><Link href={`/suivi?vehicle=${vehicle.id}`}>Suivi véhicule</Link><Link href={`/documents?vehicle=${vehicle.id}`}>Documents</Link><Link href={`/statistiques?vehicle=${vehicle.id}`}>Coût et statistiques</Link></div><PhotoForm vehicleId={vehicle.id} />
          {rights.canWrite && vehicle.status === "ACTIVE" ? <VehicleArchiveForm vehicleId={vehicle.id} currentMileage={current} /> : null}
          {!rights.owner && received ? <VehiclePermissions canWrite={true}><div className="mt-5"><ApiActionButton endpoint={`/api/shares/${received.id}`} method="DELETE" confirmation="Quitter le partage de ce véhicule ?">Quitter le partage</ApiActionButton></div></VehiclePermissions> : null}
        </div>
        {rights.owner ? <div className="border-t border-[var(--line-soft)] px-5 pb-5 sm:px-7 sm:pb-7 lg:col-span-2"><SharePanel vehicleId={vehicle.id} shares={vehicle.shares} /></div> : null}
      </article></VehiclePermissions>;
    })}</div> : <Panel className="p-8 text-center text-sm text-[var(--muted)]">Aucun véhicule. Utilisez le formulaire ci-dessus pour ouvrir votre garage.</Panel>}
  </div>;
}
