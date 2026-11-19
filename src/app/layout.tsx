// src/app/layout.tsx
import { cookies } from "next/headers";
import { getCurrentUser } from "@/lib/auth";
import { readTheme, THEME_COOKIE } from "@/lib/themes";
import type { Metadata, Viewport } from "next";
import { GeistSans } from "geist/font/sans";
import "./globals.css";

export const metadata: Metadata = {
  title: { default: "Drivio", template: "%s · Drivio" },
  description: "Le registre personnel de votre automobile.",
  manifest: "/manifest.webmanifest",
  appleWebApp: { capable: true, title: "Drivio", statusBarStyle: "default" },
  icons: { apple: "/pwa-icon?size=192" },
};
export const viewport: Viewport = { width: "device-width", initialScale: 1, viewportFit: "cover" };

export default async function RootLayout({ children }: Readonly<{ children: React.ReactNode }>) {
  const user = await getCurrentUser();
  const theme = user ? readTheme(`${user.themeMode}:${user.themePalette}`) : readTheme((await cookies()).get(THEME_COOKIE)?.value);
  return (
    <html lang="fr" className={GeistSans.variable} data-theme={theme.mode} data-palette={theme.palette} data-interface={user?.interfaceStyle === "horizon" ? "horizon" : "classic"}>
      <body>{children}</body>
    </html>
  );
}
