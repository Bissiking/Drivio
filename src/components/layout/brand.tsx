// src/components/layout/brand.tsx
import Link from "next/link";

export function Brand() {
  return <Link href="/dashboard" aria-label="Drivio — Dashboard" className="inline-flex items-center gap-2.5 rounded-lg px-2 py-1 focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-[var(--accent)]">
    <svg aria-hidden="true" viewBox="0 0 28 32" className="h-8 w-7 text-[var(--accent)]" fill="currentColor">
      <path d="M10.5 1.5h15L19 13H8L10.5 1.5Z" />
      <path d="M8.5 15h11L10 30.5H0L8.5 15Z" />
    </svg>
    <span className="text-[27px] font-semibold tracking-[-0.04em] text-[var(--text)]">Drivio</span>
  </Link>;
}
