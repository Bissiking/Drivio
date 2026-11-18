// src/app/api/auth/login/route.ts
import { randomBytes } from "node:crypto";
import { NextResponse } from "next/server";
import { createAuthorizationRequest, createPkce } from "@/lib/kyros";
import {safeConsentReturn} from '@/lib/return-to';

export async function GET(request:Request) {
  try {
    const state = randomBytes(32).toString("base64url");
    const { verifier, challenge } = createPkce();
    const authorizeUrl = await createAuthorizationRequest(state, challenge);
    const response = NextResponse.redirect(authorizeUrl);
    const secure = process.env.NODE_ENV === "production";
    response.cookies.set("drivio_oauth_state", state, { httpOnly: true, secure, sameSite: "lax", path: "/", maxAge: 600 });
    response.cookies.set("drivio_pkce", verifier, { httpOnly: true, secure, sameSite: "lax", path: "/", maxAge: 600 });
    const returnTo=safeConsentReturn(new URL(request.url).searchParams.get('returnTo'));
    if(returnTo)response.cookies.set('drivio_return_to',Buffer.from(returnTo).toString('base64url'),{httpOnly:true,secure,sameSite:'lax',path:'/',maxAge:600});
    else response.cookies.delete('drivio_return_to');
    return response;
  } catch (error) {
    const message = error instanceof Error ? error.message : "Connexion indisponible";
    return NextResponse.redirect(new URL(`/connexion?error=${encodeURIComponent(message)}`, process.env.NEXT_PUBLIC_APP_URL ?? "http://localhost:3000"));
  }
}
