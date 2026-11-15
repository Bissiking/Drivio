// src/components/layout/navigation-pending.tsx
"use client";
import { useLinkStatus } from "next/link";
export function NavigationPending() {
  const { pending } = useLinkStatus();
  return pending ? <span role="status" className="navigation-pending fixed inset-x-0 top-0 z-[70] border-b border-[var(--line)] bg-[var(--surface-raised)] px-5 py-2 text-center text-xs text-[var(--accent)]">Chargement de la page…</span> : null;
}
