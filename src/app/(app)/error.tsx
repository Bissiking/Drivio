// src/app/(app)/error.tsx
"use client";
import { Button } from "@/components/ui/button";
export default function PageError({ reset }: { error: Error & { digest?: string }; reset: () => void }) {
  return <div role="alert" className="mx-auto max-w-xl space-y-5 py-12"><h1 className="text-2xl font-medium">Le registre n’a pas pu être chargé</h1><p className="text-sm text-[var(--muted)]">Réessayez dans quelques instants. Vos données enregistrées sont conservées.</p><Button onClick={reset}>Réessayer</Button></div>;
}

