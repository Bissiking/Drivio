"use client";
import Link from "next/link";
import { useEffect } from "react";
import { useRouter } from "next/navigation";
import { homeDestination } from "@/lib/experience";

export function HomeRedirect() {
  const router = useRouter();
  useEffect(() => {
    const installed = window.matchMedia("(display-mode: standalone)").matches || (navigator as Navigator & { standalone?: boolean }).standalone === true;
    router.replace(homeDestination("auto", installed));
  }, [router]);
  return <main className="mx-auto flex min-h-dvh max-w-lg flex-col justify-center gap-5 px-6"><p role="status">Ouverture de votre accueil…</p><nav aria-label="Choisir une page"><Link className="mr-6 underline" href="/dashboard">Dashboard</Link><Link className="underline" href="/ajouter">Ajouter</Link></nav></main>;
}
