// src/app/page.tsx
import { redirect } from "next/navigation";
import { getCurrentUser } from "@/lib/auth";
import { HomeRedirect } from "@/components/layout/home-redirect";
import { homeDestination } from "@/lib/experience";

export default async function HomePage() {
  const user = await getCurrentUser();
  if (!user) redirect("/connexion");
  if (user.homePage !== "auto") redirect(homeDestination(user.homePage, false));
  return <HomeRedirect />;
}
