// src/components/layout/panel.tsx
import { cn } from "@/lib/utils";

export function Panel({ children, className, title, description }: { children: React.ReactNode; className?: string; title?: string; description?: string }) {
  return <section className={cn("rounded-2xl bg-[var(--surface)]", className)}>{title ? <header className="border-b border-[var(--line-soft)] px-5 py-4 sm:px-6"><h2 className="text-base font-medium">{title}</h2>{description ? <p className="mt-1 text-sm text-[var(--muted)]">{description}</p> : null}</header> : null}{children}</section>;
}
