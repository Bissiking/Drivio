// src/app/api/auth/logout/route.ts
import { NextResponse } from "next/server";
import { getSession, SESSION_COOKIE } from "@/lib/auth";
import { revokeKyrosToken } from "@/lib/kyros";

export async function POST() {
  const session = await getSession();
  if (session) {
    try {
      await revokeKyrosToken(session.refreshToken);
    } catch {
      // La déconnexion locale doit rester possible si Kyros est indisponible.
    }
  }
  const response = NextResponse.redirect(new URL("/connexion", process.env.NEXT_PUBLIC_APP_URL ?? "http://localhost:3000"), 303);
  response.cookies.delete(SESSION_COOKIE);
  return response;
}
