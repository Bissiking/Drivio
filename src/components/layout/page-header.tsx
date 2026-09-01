// src/components/layout/page-header.tsx
export function PageHeader({ title, description, action }: { title: string; description: string; action?: React.ReactNode }) {
  return <header className="flex flex-col gap-5 border-b border-[var(--line-soft)] pb-7 sm:flex-row sm:items-end sm:justify-between"><div><h1 className="text-3xl font-medium tracking-[-0.035em] sm:text-4xl">{title}</h1><p className="mt-2 max-w-2xl text-sm leading-6 text-[var(--muted)]">{description}</p></div>{action}</header>;
}
