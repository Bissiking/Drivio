// src/app/(app)/studio-images/page.tsx
import type { Metadata } from "next";
import Link from "next/link";
import { VehicleImageStudio } from "@/components/forms/vehicle-image-studio";
import { PageHeader } from "@/components/layout/page-header";
import { Panel } from "@/components/layout/panel";
import { Button } from "@/components/ui/button";
import { requirePageUser } from "@/lib/auth";
import { db } from "@/lib/db";

export const metadata: Metadata = { title: "Studio images" };

const directionContract = "THESIS: transformer une intention visuelle en demande exploitable, sans prétendre générer dans Drivio. OWN-WORLD: atelier asymétrique graphite, grand aperçu à gauche, réglages et actions à droite, registre continu. STORY: choisir un véhicule, détailler l’image, copier le prompt puis ajouter le résultat ou sa propre photo. FIRST VIEWPORT: aperçu majoritaire et formulaire complet immédiatement actionnable. FORM: composition A approuvée; seed 954df9fd. FINISH: unreviewed and undocumented is unfinished; this build ends with the finish review, the verdict, and DESIGN.md";

export default async function StudioImagesPage() {
  const user = await requirePageUser();
  const vehicles = await db.vehicle.findMany({ where: { userId: user.id }, orderBy: [{ isPrimary: "desc" }, { createdAt: "asc" }], select: { id: true, brand: true, model: true, trim: true, powertrain: true, year: true, photoPath: true, photoUrl: true } });
  const requests = await db.vehicleImageRequest.findMany({ where: { vehicle: { userId: user.id } }, orderBy: { createdAt: "desc" }, take: 100 });
  return <div className="space-y-8" data-direction-contract={directionContract}>
    <PageHeader title="Studio images" description="Prépare une demande détaillée, génère l’image où tu veux, puis conserve le résultat dans ton garage." />
    {vehicles.length ? <VehicleImageStudio vehicles={vehicles} initialRequests={requests.map((request) => ({ ...request, createdAt: request.createdAt.toISOString() }))} /> : <Panel className="p-8 text-center"><p className="text-sm text-[var(--muted)]">Ajoute d’abord un véhicule pour préparer son image.</p><Button asChild className="mt-5"><Link href="/garage">Ouvrir le garage</Link></Button></Panel>}
  </div>;
}
