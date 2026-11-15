// src/app/(app)/rapports/page.tsx
import type { Metadata } from "next";
import { PageHeader } from "@/components/layout/page-header";
import { Panel } from "@/components/layout/panel";
import { VehiclePicker } from "@/components/layout/vehicle-picker";
import { ReportForm } from "@/components/forms/report-form";
import { requirePageUser } from "@/lib/auth";
import { vehicleWorkspace } from "@/lib/vehicle-workspace";
import { formatDate, toDateInput } from "@/lib/format";
export const metadata: Metadata = { title: "Rapports PDF" };
export default async function ReportsPage({ searchParams }: { searchParams: Promise<{ vehicle?: string }> }) {
  const user = await requirePageUser(), query = await searchParams, { vehicles, vehicle } = await vehicleWorkspace(user.id, query.vehicle);
  return <div className="space-y-7"><PageHeader title="Rapports PDF" description="Préparez une synthèse, un dossier d'entretien ou un historique à transmettre à un acheteur." /><VehiclePicker vehicles={vehicles} selected={vehicle?.id} href="/rapports" />{vehicle ? <Panel title="Composer votre rapport" description="Export privé, limité au véhicule sélectionné. Les informations sensibles sont masquées par défaut."><div className="p-5 sm:p-6"><ReportForm key={vehicle.id} vehicleId={vehicle.id} purchaseDate={toDateInput(vehicle.purchaseDate)} documents={vehicle.documents.filter(d => ["application/pdf", "image/jpeg", "image/png"].includes(d.mimeType)).map(d => ({ id: d.id, date: formatDate(d.date), mimeType: d.mimeType }))} /></div></Panel> : <p className="text-sm text-[var(--muted)]">Ajoutez ou sélectionnez un véhicule dans le Garage.</p>}</div>;
}
