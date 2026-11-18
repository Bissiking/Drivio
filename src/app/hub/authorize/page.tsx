import type { Metadata } from "next";
import { cookies } from "next/headers";
import { ShieldCheck, ArrowRight, Link2 } from "lucide-react";
import { getCurrentUser, SESSION_COOKIE } from "@/lib/auth";
import { db } from "@/lib/db";
import {
  hubApplication,
  parseHubRequest,
  consentIntent,
  allowedHubVehicles,
} from "@/lib/hub-authorization";
import { Button } from "@/components/ui/button";
import { HubConsentForm } from "@/components/forms/hub-consent-form";
export const metadata: Metadata = {
  title: "Autoriser LUMA Hub",
  referrer: "same-origin",
  robots: { index: false, follow: false },
};
export const dynamic = "force-dynamic";
export default async function HubAuthorizePage({
  searchParams,
}: {
  searchParams: Promise<Record<string, string | string[] | undefined>>;
}) {
  const params = await searchParams,
    query = new URLSearchParams();
  for (const [key, value] of Object.entries(params)) {
    if (Array.isArray(value)) value.forEach((v) => query.append(key, v));
    else if (value !== undefined) query.set(key, value);
  }
  let request;
  try {
    request = parseHubRequest(query);
  } catch {
    return (
      <main className="mx-auto flex min-h-screen max-w-xl flex-col justify-center gap-6 p-6">
        <h1 className="text-2xl font-semibold">
          Demande d’autorisation invalide
        </h1>
        <p className="text-[var(--muted)]">
          Relancez la connexion depuis LUMA Hub pour choisir les véhicules à
          partager.
        </p>
        <a
          className="text-[var(--accent)]"
          href={hubApplication().redirectUri.replace(
            "/api/connectors/drivio/callback",
            "/",
          )}
        >
          Retour à LUMA Hub
        </a>
      </main>
    );
  }
  const user = await getCurrentUser();
  if (!user)
    return (
      <main className="mx-auto flex min-h-screen max-w-xl flex-col justify-center gap-6 p-6">
        <p className="text-lg font-semibold">
          Drivio <span className="text-[var(--muted)]">· LUMA Hub</span>
        </p>
        <h1 className="text-3xl font-semibold tracking-tight">
          Connecter votre garage
        </h1>
        <p className="leading-7 text-[var(--muted)]">
          Connectez-vous à Drivio avec le même compte Kyros que dans le Hub.
          Vous choisirez ensuite les véhicules accessibles.
        </p>
        <Button asChild size="lg">
          <a
            href={`/api/auth/login?returnTo=${encodeURIComponent("/hub/authorize?" + query)}`}
          >
            Continuer avec Kyros
            <ArrowRight className="size-4" />
          </a>
        </Button>
      </main>
    );
  const vehicles = await db.vehicle.findMany({
    where: { userId: user.id },
    select: {
      id: true,
      brand: true,
      model: true,
      year: true,
      isPrimary: true,
      status: true,
    },
    orderBy: [{ isPrimary: "desc" }, { createdAt: "asc" }],
    take: 500,
  });
  const grant = await db.hubApplication.findUnique({
    where: { userId_clientId: { userId: user.id, clientId: request.clientId } },
    select: { vehicleIds: true, revokedAt: true, expiresAt: true },
  });
  const initialSelected =
    grant && !grant.revokedAt && grant.expiresAt > new Date()
      ? allowedHubVehicles(grant.vehicleIds).filter((id) =>
          vehicles.some((vehicle) => vehicle.id === id),
        )
      : vehicles
          .filter((vehicle, index) => vehicle.isPrimary || index === 0)
          .map((vehicle) => vehicle.id);
  const intent = consentIntent(
    request,
    user.id,
    (await cookies()).get(SESSION_COOKIE)?.value || "",
  );
  return (
    <main className="mx-auto min-h-screen max-w-2xl px-5 py-10 sm:px-8 sm:py-16">
      <header className="mb-10 flex items-center justify-between gap-4">
        <strong className="text-xl tracking-tight">Drivio</strong>
        <span className="flex items-center gap-2 text-sm text-[var(--muted)]">
          <Link2 className="size-4" />
          LUMA Hub
        </span>
      </header>
      <h1 className="text-3xl font-semibold tracking-tight">
        Partager votre garage avec LUMA Hub
      </h1>
      <p className="mt-4 max-w-xl leading-7 text-[var(--muted)]">
        Retrouvez le kilométrage, les entretiens, les alertes, les dépenses et
        le carburant des véhicules choisis dans vos widgets.
      </p>
      <div className="my-7 flex gap-3 border-y border-[var(--line)] py-5">
        <ShieldCheck className="mt-1 size-5 shrink-0 text-[var(--accent)]" />
        <div>
          <p className="font-medium">Accès en lecture seule</p>
          <p className="mt-1 text-sm leading-6 text-[var(--muted)]">
            LUMA Hub ne pourra ni modifier ni supprimer vos données. Vous
            pourrez retirer cet accès dans les paramètres Drivio.
          </p>
        </div>
      </div>
      <HubConsentForm
        intent={intent}
        vehicles={vehicles}
        initialSelected={initialSelected}
      />
    </main>
  );
}
