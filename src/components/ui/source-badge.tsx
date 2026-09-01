// src/components/ui/source-badge.tsx
import { cn } from "@/lib/utils";

const styles = {
  real: "border-[var(--accent)]/35 text-[var(--accent)]",
  calculated: "border-[var(--line)] text-[var(--muted)]",
  estimated: "border-dashed border-[var(--warning)]/45 text-[var(--warning)]",
};

export function SourceBadge({ kind, className }: { kind: keyof typeof styles; className?: string }) {
  const label = kind === "real" ? "Réel" : kind === "calculated" ? "Calculé" : "Estimé";
  return <span className={cn("inline-flex rounded-md border px-1.5 py-0.5 text-[10px] font-medium uppercase tracking-[.08em]", styles[kind], className)}>{label}</span>;
}
