import { NextResponse } from "next/server";
import { createSessionToken, getSession, sessionCookieOptions, SESSION_COOKIE } from "@/lib/auth";
import { KyrosTokenError, refreshKyrosTokens, verifyKyrosToken } from "@/lib/kyros";

const REFRESH_MARGIN_MS = 2 * 60 * 1000;

export async function POST() {
  const session = await getSession();
  if (!session) return new NextResponse(null, { status: 204 });
  if (session.refreshExpiresAt <= Date.now()) {
    const response = NextResponse.json({ error: "session_expired" }, { status: 401 });
    response.cookies.delete(SESSION_COOKIE);
    return response;
  }
  if (session.accessExpiresAt - Date.now() > REFRESH_MARGIN_MS) return new NextResponse(null, { status: 204 });

  try {
    const tokens = await refreshKyrosTokens(session.refreshToken);
    const claims = await verifyKyrosToken(tokens.access_token);
    if (claims.sub !== session.subject) throw new Error("L'identité Kyros a changé pendant le rafraîchissement.");

    const refreshExpiresAt = Date.parse(tokens.refresh_token_expires_at);
    if (!Number.isFinite(refreshExpiresAt) || refreshExpiresAt <= Date.now()) {
      throw new Error("Kyros a émis une session dont l'expiration est invalide.");
    }
    const token = await createSessionToken({
      ...session,
      refreshToken: tokens.refresh_token,
      accessExpiresAt: Date.now() + tokens.expires_in * 1000,
      refreshExpiresAt,
    });
    const response = new NextResponse(null, { status: 204 });
    response.cookies.set(SESSION_COOKIE, token, sessionCookieOptions(refreshExpiresAt));
    return response;
  } catch (error) {
    if (error instanceof KyrosTokenError && error.retryable) {
      return NextResponse.json({ error: "refresh_temporarily_unavailable" }, { status: 503 });
    }
    const response = NextResponse.json({ error: "session_expired" }, { status: 401 });
    response.cookies.delete(SESSION_COOKIE);
    return response;
  }
}
