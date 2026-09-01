// src/app/layout.tsx
import type { Metadata } from "next";
import { GeistSans } from "geist/font/sans";
import "./globals.css";

export const metadata: Metadata = {
  title: { default: "Drivio", template: "%s · Drivio" },
  description: "Le registre personnel de votre automobile.",
};

const directionContract = [
  "THESIS: Un registre automobile personnel qui place les faits avant les ornements et refuse le tableau de bord en tuiles.",
  "OWN-WORLD: Graphite mat, regles minerales, chiffres tabulaires, vert precis et photographie nocturne editoriale.",
  "STORY: Voir le vehicule, comprendre son rythme et agir sur sa prochaine echeance.",
  "FIRST VIEWPORT: Navigation explicite, bandeau vehicule horizontal, kilometrage dominant, echeance puis analyse et historique.",
  "FORM: Fusion Photo-ledger et Registre horizontal; seed b41a1437.",
  "FINISH: unreviewed and undocumented is unfinished; this build ends with the finish review, the verdict, and DESIGN.md",
].join(" ");

export default function RootLayout({ children }: Readonly<{ children: React.ReactNode }>) {
  return (
    <html lang="fr" className={GeistSans.variable}>
      <body data-direction-contract={directionContract}>{children}</body>
    </html>
  );
}
