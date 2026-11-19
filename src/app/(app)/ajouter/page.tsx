import type { Metadata } from "next";
import Link from "next/link";
import { QuickEntryActions } from "@/components/forms/quick-entry";
import { PageHeader } from "@/components/layout/page-header";
import { requirePageUser } from "@/lib/auth";

export const metadata: Metadata = { title: "Ajouter" };
export default async function AddPage() {
  await requirePageUser();
  return <div className="add-page">
    <PageHeader title="Ajouter au registre" description="Un kilométrage, un plein ou une dépense : choisissez votre saisie." />
    <section aria-label="Ajouter au registre"><QuickEntryActions /></section>
    <p className="text-sm leading-6 text-[var(--muted)]">Le véhicule se choisit dans le formulaire. Les saisies sont enregistrées dans les mêmes registres que d’habitude.</p>
    <nav aria-label="Continuer dans Drivio" className="flex flex-wrap gap-x-6 gap-y-3 text-sm text-[var(--accent)]"><Link href="/dashboard">Consulter le Dashboard</Link><Link href="/garage">Ouvrir le Garage</Link><Link href="/parametres">Changer mon accueil</Link></nav>
  </div>;
}
