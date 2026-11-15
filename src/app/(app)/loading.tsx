// src/app/(app)/loading.tsx
export default function Loading() {
  return <div role="status" aria-label="Chargement de la page" className="space-y-7"><p className="text-sm text-[var(--accent)]">Chargement de votre registre…</p><div aria-hidden="true" className="space-y-6 motion-safe:animate-pulse"><div className="h-9 w-52 rounded-lg bg-[var(--surface-soft)]" /><div className="h-11 w-full max-w-sm rounded-lg bg-[var(--surface)]" /><div className="grid grid-cols-2 gap-4 sm:grid-cols-3">{[0, 1, 2].map(n => <div key={n} className="h-28 rounded-xl bg-[var(--surface)]" />)}</div><div className="h-64 rounded-xl bg-[var(--surface)]" /></div></div>;
}
