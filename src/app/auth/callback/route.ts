// src/app/auth/callback/route.ts
import { NextRequest, NextResponse } from "next/server";
import { createSessionToken, SESSION_COOKIE } from "@/lib/auth";
import { db } from "@/lib/db";
import { exchangeAuthorizationCode, getKyrosConfig, verifyKyrosToken } from "@/lib/kyros";

export async function GET(request: NextRequest) {
  const appUrl = process.env.NEXT_PUBLIC_APP_URL ?? "http://localhost:3000";
  try {
    const code = request.nextUrl.searchParams.get("code");
    const state = request.nextUrl.searchParams.get("state");
    const issuer = request.nextUrl.searchParams.get("iss");
    const storedState = request.cookies.get("drivio_oauth_state")?.value;
    const verifier = request.cookies.get("drivio_pkce")?.value;
    const config = getKyrosConfig();
    if (!code || !state || !storedState || state !== storedState || !verifier) throw new Error("Réponse Kyros invalide ou expirée.");
    if (!issuer || issuer.replace(/\/$/, "") !== config.issuer.replace(/\/$/, "")) throw new Error("Émetteur Kyros inattendu.");

    const accessToken = await exchangeAuthorizationCode(code, verifier);
    const claims = await verifyKyrosToken(accessToken);
    if (!claims.sub) throw new Error("Le jeton Kyros ne contient pas d'identifiant utilisateur.");

    const user = await db.user.upsert({
      where: { kyrosSubject: claims.sub },
      update: {
        email: typeof claims.email === "string" ? claims.email : undefined,
        name: typeof claims.name === "string" ? claims.name : undefined,
        avatarUrl: typeof claims.picture === "string" ? claims.picture : undefined,
      },
      create: {
        kyrosSubject: claims.sub,
        email: typeof claims.email === "string" ? claims.email : null,
        name: typeof claims.name === "string" ? claims.name : "Utilisateur Drivio",
        avatarUrl: typeof claims.picture === "string" ? claims.picture : null,
      },
    });
    const session = await createSessionToken(user.id, user.kyrosSubject);
    const response = NextResponse.redirect(new URL("/dashboard", appUrl));
    response.cookies.set(SESSION_COOKIE, session, {
      httpOnly: true,
      secure: process.env.NODE_ENV === "production",
      sameSite: "lax",
      path: "/",
      maxAge: 60 * 60 * 8,
    });
    response.cookies.delete("drivio_oauth_state");
    response.cookies.delete("drivio_pkce");
    return response;
  } catch (error) {
    const message = error instanceof Error ? error.message : "Connexion impossible";
    return NextResponse.redirect(new URL(`/connexion?error=${encodeURIComponent(message)}`, appUrl));
  }
}
