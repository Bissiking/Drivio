// src/app/(app)/parametres/page.tsx
import { NOTIFICATION_TYPES } from "@/lib/notification-types";
import { APP_VERSION } from "@/lib/version";
import { db } from "@/lib/db";
import { NotificationForm } from "@/components/forms/notification-form";
import type { Metadata } from "next";
import { Database, HardDrive, LogOut, ShieldCheck } from "lucide-react";
import { PageHeader } from "@/components/layout/page-header";
import { Panel } from "@/components/layout/panel";
import { Button } from "@/components/ui/button";
import { requirePageUser } from "@/lib/auth";

export const metadata: Metadata = { title: "Paramètres" };

export default async function SettingsPage() {
  const user = await requirePageUser();
  const settings = await db.notificationSettings.findUnique({ where: { userId: user.id } });
  const preferences = { enabled: settings?.enabled ?? false, maintenance: settings?.maintenance ?? true, warranty: settings?.warranty ?? true, inspection: settings?.inspection ?? true, insurance: settings?.insurance ?? true, warningDays: settings?.warningDays ?? 30, warningKm: settings?.warningKm ?? 1500, hasToken: Boolean(settings?.tokenEncrypted), enabledTypes: settings ? settings.enabledTypes.split(",") : [...NOTIFICATION_TYPES] };
  const database = (process.env.DATABASE_URL ?? "file:./prisma/dev.db").startsWith("postgres") ? "PostgreSQL" : "SQLite";
  return <div className="space-y-8">
    <PageHeader title="Paramètres" description="Compte, sécurité et environnement de votre registre." />
    <Panel title="Drivio" description={`Version ${APP_VERSION} · Graphite & cuivre`}>{null}</Panel>
    <Panel title="Notifications Gotify" description="Alertes côté serveur, selon vos catégories et seuils."><div className="max-w-3xl p-5 sm:p-6"><NotificationForm settings={preferences} /></div></Panel>
    <div className="grid gap-6 xl:grid-cols-2">
      <Panel title="Compte Kyros"><div className="p-5 sm:p-6"><div className="flex items-center gap-4"><span className="flex size-12 items-center justify-center rounded-full bg-[var(--surface-soft)] text-lg font-medium text-[var(--accent)]">{(user.name ?? user.email ?? "D").slice(0, 1).toUpperCase()}</span><div><p className="font-medium">{user.name ?? "Utilisateur Drivio"}</p><p className="mt-1 text-sm text-[var(--muted)]">{user.email ?? "Adresse non transmise par Kyros"}</p></div></div><div className="mt-6 flex items-start gap-3 border-t border-[var(--line-soft)] pt-5"><ShieldCheck className="mt-0.5 size-5 text-[var(--accent)]" /><div><p className="text-sm font-medium">Kyros SSO v4</p><p className="mt-1 text-xs leading-5 text-[var(--muted)]">Session issue d’un flux PAR + PKCE S256. Aucun mot de passe n’est stocké par Drivio.</p></div></div><form action="/api/auth/logout" method="post" className="mt-7"><Button type="submit" variant="outline"><LogOut className="size-4" />Se déconnecter</Button></form></div></Panel>
      <Panel title="Stockage"><div className="divide-y divide-[var(--line-soft)] px-5 sm:px-6"><SettingLine icon={Database} label="Base de données" value={database} detail={database === "SQLite" ? "Environnement de développement" : "Environnement de production"} /><SettingLine icon={HardDrive} label="Documents" value="Stockage privé" detail="PDF, JPG, PNG et WebP · téléchargement authentifié" /><SettingLine icon={HardDrive} label="Photos" value="Fichiers physiques" detail="public/uploads, avec URL externe en alternative" /></div></Panel>
    </div>
    <p className="text-xs text-[var(--quiet)]">Drivio {APP_VERSION} · Interface sombre par défaut</p>
  </div>;
}

function SettingLine({ icon: Icon, label, value, detail }: { icon: typeof Database; label: string; value: string; detail: string }) { return <div className="flex gap-4 py-5"><Icon className="mt-0.5 size-5 text-[var(--muted)]" /><div className="min-w-0 flex-1"><div className="flex items-center justify-between gap-4"><p className="text-sm font-medium">{label}</p><span className="text-sm text-[var(--accent)]">{value}</span></div><p className="mt-1 text-xs text-[var(--quiet)]">{detail}</p></div></div>; }
