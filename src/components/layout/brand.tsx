// src/components/layout/brand.tsx
import Link from "next/link";
import { CarFront } from "lucide-react";
import { APP_VERSION } from "@/lib/version";

export function Brand({ horizon = false }: { horizon?: boolean }) {
  return <Link href="/dashboard" aria-label="Drivio — Dashboard" className="inline-flex items-center gap-2.5 rounded-lg px-2 py-1 focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-[var(--accent)]">
    {horizon ? <CarFront aria-hidden="true" className="h-8 w-9 text-[var(--accent)]" strokeWidth={1.7} /> : <svg aria-hidden="true" viewBox="0 0 28 32" className="h-8 w-7 text-[var(--accent)]" fill="currentColor">
      <path d="M10.5 1.5h15L19 13H8L10.5 1.5Z" />
      <path d="M8.5 15h11L10 30.5H0L8.5 15Z" />
    </svg>}
    <span className="text-[27px] font-semibold tracking-[-0.04em] text-[var(--text)]">Drivio</span>
    {horizon ? <span className="self-end pb-1 text-[10px] text-[var(--muted)]">{APP_VERSION}</span> : null}
  </Link>;
}
