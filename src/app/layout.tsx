// src/app/layout.tsx
import { cookies } from "next/headers";
import { getCurrentUser } from "@/lib/auth";
import { readTheme, THEME_COOKIE } from "@/lib/themes";
import type { Metadata } from "next";
import { GeistSans } from "geist/font/sans";
import "./globals.css";

export const metadata: Metadata = {
  title: { default: "Drivio", template: "%s · Drivio" },
  description: "Le registre personnel de votre automobile.",
};

export default async function RootLayout({ children }: Readonly<{ children: React.ReactNode }>) {
  const user = await getCurrentUser();
  const theme = user ? readTheme(`${user.themeMode}:${user.themePalette}`) : readTheme((await cookies()).get(THEME_COOKIE)?.value);
  return (
    <html lang="fr" className={GeistSans.variable} data-theme={theme.mode} data-palette={theme.palette}>
      <body>{children}</body>
    </html>
  );
}
