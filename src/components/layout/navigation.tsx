// src/components/layout/navigation.tsx
"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { useState } from "react";
import { BarChart3, Car, Fuel, Gauge, History, Images, Menu, ReceiptText, Settings, Wrench } from "lucide-react";
import { Brand } from "@/components/layout/brand";
import { cn } from "@/lib/utils";

const items = [
  { href: "/dashboard", label: "Dashboard", icon: BarChart3 },
  { href: "/garage", label: "Garage", icon: Car },
  { href: "/kilometrage", label: "Kilométrage", icon: Gauge },
  { href: "/entretiens", label: "Entretiens", icon: Wrench },
  { href: "/carburant", label: "Carburant", icon: Fuel },
  { href: "/depenses", label: "Dépenses", icon: ReceiptText },
  { href: "/historique", label: "Historique", icon: History },
  { href: "/studio-images", label: "Studio images", icon: Images },
  { href: "/parametres", label: "Paramètres", icon: Settings },
];

export function Navigation() {
  const pathname = usePathname();
  const [moreOpen, setMoreOpen] = useState(false);
  const mobileItems = items.slice(0, 4);
  const moreItems = items.slice(4);
  return (
    <>
      <aside className="fixed inset-y-0 left-0 z-40 hidden w-60 border-r border-[var(--line-soft)] bg-[#0b0e0d] px-4 py-7 lg:flex lg:flex-col">
        <Brand />
        <nav aria-label="Navigation principale" className="mt-12 space-y-1">
          {items.map(({ href, label, icon: Icon }) => {
            const active = pathname.startsWith(href);
            return <Link key={href} href={href} aria-current={active ? "page" : undefined} className={cn("flex h-11 items-center gap-3 rounded-xl px-3 text-sm transition", active ? "bg-[var(--surface-soft)] text-[var(--text)]" : "text-[var(--muted)] hover:bg-[var(--surface)] hover:text-[var(--text)]")}><Icon className={cn("size-[18px]", active && "text-[var(--accent)]")} strokeWidth={1.7} />{label}</Link>;
          })}
        </nav>
        <div className="mt-auto border-t border-[var(--line-soft)] px-3 pt-5 text-xs leading-5 text-[var(--quiet)]">Registre technique<br />Drivio 1.0.0</div>
      </aside>
      <nav aria-label="Navigation mobile" className="fixed inset-x-0 bottom-0 z-50 grid h-[72px] grid-cols-5 border-t border-[var(--line)] bg-[#0b0e0d]/95 px-2 backdrop-blur lg:hidden">
        {mobileItems.map(({ href, label, icon: Icon }) => {
          const active = pathname.startsWith(href);
          return <Link key={href} href={href} aria-current={active ? "page" : undefined} onClick={() => setMoreOpen(false)} className={cn("flex min-w-0 flex-col items-center justify-center gap-1 text-[10px]", active ? "text-[var(--accent)]" : "text-[var(--quiet)]")}><Icon className="size-5" strokeWidth={1.7} />{label}</Link>;
        })}
        <button type="button" aria-expanded={moreOpen} aria-controls="mobile-more-navigation" onClick={() => setMoreOpen((open) => !open)} className={cn("flex min-w-0 flex-col items-center justify-center gap-1 text-[10px]", moreItems.some(({ href }) => pathname.startsWith(href)) || moreOpen ? "text-[var(--accent)]" : "text-[var(--quiet)]")}><Menu className="size-5" strokeWidth={1.7} />Plus</button>
        {moreOpen ? <div id="mobile-more-navigation" className="absolute bottom-[82px] right-3 w-56 overflow-hidden rounded-2xl bg-[var(--surface-raised)] shadow-[0_18px_50px_rgba(0,0,0,.42)]">{moreItems.map(({ href, label, icon: Icon }) => { const active = pathname.startsWith(href); return <Link key={href} href={href} aria-current={active ? "page" : undefined} onClick={() => setMoreOpen(false)} className={cn("flex h-12 items-center gap-3 border-b border-[var(--line-soft)] px-4 text-sm last:border-0", active ? "text-[var(--accent)]" : "text-[var(--text)]")}><Icon className="size-[18px]" strokeWidth={1.7} />{label}</Link>; })}</div> : null}
      </nav>
    </>
  );
}
