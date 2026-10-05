// src/app/connexion/page.tsx
import { APP_VERSION } from "@/lib/version";
import type { Metadata } from "next";
import { ArrowRight, BookOpenText, ShieldCheck } from "lucide-react";

export const metadata: Metadata = { title: "Connexion" };

export default async function LoginPage({ searchParams }: { searchParams: Promise<{ error?: string }> }) {
  const { error } = await searchParams;
  return (
    <main className="grid min-h-screen bg-[var(--ink)] lg:grid-cols-[1.1fr_.9fr]">
      <section className="relative hidden overflow-hidden border-r border-[var(--line)] p-12 lg:flex lg:flex-col lg:justify-between">
        <div className="text-2xl font-semibold tracking-[-0.03em]">Drivio</div>
        <div className="max-w-2xl">
          <BookOpenText className="mb-8 size-10 text-[var(--accent)]" strokeWidth={1.5} />
          <h1 className="max-w-xl text-6xl font-medium leading-[.98] tracking-[-0.04em]">Votre automobile, consignée avec précision.</h1>
          <p className="mt-7 max-w-lg text-lg leading-8 text-[var(--muted)]">Kilométrage, entretien, carburant et dépenses réunis dans un registre personnel clair.</p>
        </div>
        <p className="text-sm text-[var(--quiet)]">Drivio {APP_VERSION} · Registre technique personnel</p>
      </section>
      <section className="flex min-h-screen items-center justify-center p-6 sm:p-12">
        <div className="w-full max-w-md">
          <div className="mb-14 text-2xl font-semibold tracking-[-0.03em] lg:hidden">Drivio</div>
          <ShieldCheck className="mb-7 size-9 text-[var(--accent)]" strokeWidth={1.5} />
          <h2 className="text-3xl font-medium tracking-[-0.03em]">Ouvrir votre registre</h2>
          <p className="mt-3 leading-7 text-[var(--muted)]">L’accès est sécurisé par Kyros SSO v4. Drivio ne conserve aucun mot de passe.</p>
          {error ? <p role="alert" className="mt-6 border border-[var(--danger)]/40 bg-[var(--danger)]/10 p-4 text-sm text-[var(--danger)]">{error}</p> : null}
          <a href="/api/auth/login" className="mt-8 flex h-12 w-full items-center justify-between rounded-xl bg-[var(--accent)] px-5 font-medium text-[var(--accent-ink)] transition hover:brightness-95 focus-visible:outline-2 focus-visible:outline-offset-4 focus-visible:outline-[var(--accent)]">
            Continuer avec Kyros <ArrowRight className="size-4" />
          </a>
          <p className="mt-5 text-xs leading-5 text-[var(--quiet)]">PAR et PKCE S256 obligatoires · Jetons RS256 vérifiés via JWKS</p>
        </div>
      </section>
    </main>
  );
}
