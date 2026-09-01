// src/lib/kyros.ts
import { createHash, randomBytes } from "node:crypto";
import { createRemoteJWKSet, jwtVerify, type JWTPayload } from "jose";

type KyrosTokenResponse = { access_token?: string; error?: string; error_description?: string };

export function getKyrosConfig() {
  const baseUrl = process.env.KYROS_BASE_URL?.replace(/\/$/, "");
  const clientId = process.env.KYROS_CLIENT_ID;
  const appUrl = process.env.NEXT_PUBLIC_APP_URL?.replace(/\/$/, "");
  if (!baseUrl || !clientId || !appUrl) {
    throw new Error("Configuration Kyros incomplète. Vérifiez KYROS_BASE_URL, KYROS_CLIENT_ID et NEXT_PUBLIC_APP_URL.");
  }
  return {
    baseUrl,
    issuer: process.env.KYROS_ISSUER ?? baseUrl,
    clientId,
    clientSecret: process.env.KYROS_CLIENT_SECRET,
    audience: process.env.KYROS_AUDIENCE ?? "kyros-modules",
    resourceAudience: process.env.KYROS_RESOURCE_AUDIENCE ?? "kyros:drivio",
    scopes: process.env.KYROS_SCOPES ?? process.env.KYROS_REQUESTED_SCOPE ?? "profile email",
    redirectUri: `${appUrl}/auth/callback`,
  };
}

export function createPkce() {
  const verifier = randomBytes(48).toString("base64url");
  const challenge = createHash("sha256").update(verifier).digest("base64url");
  return { verifier, challenge };
}

export async function createAuthorizationRequest(state: string, challenge: string) {
  const config = getKyrosConfig();
  const response = await fetch(`${config.baseUrl}/par`, {
    method: "POST",
    headers: { "content-type": "application/json" },
    body: JSON.stringify({
      client_id: config.clientId,
      client_secret: config.clientSecret || undefined,
      redirect_uri: config.redirectUri,
      scope: config.scopes,
      state,
      code_challenge: challenge,
      code_challenge_method: "S256",
      kyros_sso_version: "v4",
      kyros_edition: "standard",
      kyros_application_scope: "standard",
    }),
    cache: "no-store",
  });
  const payload = (await response.json()) as { request_uri?: string; error?: string; error_description?: string };
  if (!response.ok || !payload.request_uri) {
    throw new Error(payload.error_description ?? payload.error ?? "Kyros a refusé la requête PAR.");
  }
  const authorize = new URL(`${config.baseUrl}/authorize`);
  authorize.searchParams.set("client_id", config.clientId);
  authorize.searchParams.set("request_uri", payload.request_uri);
  return authorize;
}

export async function exchangeAuthorizationCode(code: string, verifier: string) {
  const config = getKyrosConfig();
  const response = await fetch(`${config.baseUrl}/token`, {
    method: "POST",
    headers: { "content-type": "application/json" },
    body: JSON.stringify({
      grant_type: "authorization_code",
      client_id: config.clientId,
      client_secret: config.clientSecret || undefined,
      code,
      code_verifier: verifier,
      redirect_uri: config.redirectUri,
      kyros_sso_version: "v4",
      kyros_edition: "standard",
      kyros_application_scope: "standard",
    }),
    cache: "no-store",
  });
  const payload = (await response.json()) as KyrosTokenResponse;
  if (!response.ok || !payload.access_token) {
    throw new Error(payload.error_description ?? payload.error ?? "Kyros n'a pas émis de jeton.");
  }
  return payload.access_token;
}

export async function verifyKyrosToken(token: string): Promise<JWTPayload> {
  const config = getKyrosConfig();
  const jwks = createRemoteJWKSet(new URL(`${config.baseUrl}/sso/v4/jwks`));
  const { payload } = await jwtVerify(token, jwks, {
    algorithms: ["RS256"],
    issuer: config.issuer,
    audience: config.audience,
  });
  if (
    payload.sso_version !== "v4" ||
    payload.client_id !== config.clientId ||
    payload.resource_aud !== config.resourceAudience
  ) {
    throw new Error("Le jeton Kyros n'est pas destiné à Drivio.");
  }
  return payload;
}
