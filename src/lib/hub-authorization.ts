import {
  createHash,
  createHmac,
  randomBytes,
  timingSafeEqual,
} from "node:crypto";
import { db } from "./db";
import { HUB_TOKEN_DAYS, hashHubToken } from "./hub";

export class HubAuthorizationError extends Error {
  constructor(
    public code: string,
    public status = 400,
  ) {
    super(code);
  }
}
const invalid = () => {
  throw new HubAuthorizationError("INVALID_REQUEST");
};
export function hubApplication() {
  const base = new URL(
    process.env.LUMA_HUB_URL ||
      (process.env.NODE_ENV === "production"
        ? "https://mhemery.fr"
        : "http://localhost:3000"),
  );
  if (
    base.username ||
    base.password ||
    base.hash ||
    base.search ||
    base.pathname !== "/" ||
    (base.protocol !== "https:" &&
      !(
        process.env.NODE_ENV !== "production" &&
        base.protocol === "http:" &&
        ["localhost", "127.0.0.1", "[::1]"].includes(base.hostname)
      ))
  )
    throw new Error("LUMA_HUB_URL invalide");
  return {
    id: "luma-hub",
    name: "LUMA Hub",
    redirectUri: new URL("/api/connectors/drivio/callback", base).href,
  };
}
export type HubRequest = {
  clientId: string;
  redirectUri: string;
  state: string;
  codeChallenge: string;
};
export function parseHubRequest(params: URLSearchParams): HubRequest {
  const keys = [
    "client_id",
    "redirect_uri",
    "state",
    "code_challenge",
    "code_challenge_method",
  ];
  for (const key of params.keys())
    if (!keys.includes(key) || params.getAll(key).length !== 1) invalid();
  const app = hubApplication(),
    state = params.get("state") || "",
    challenge = params.get("code_challenge") || "";
  if (
    params.get("client_id") !== app.id ||
    params.get("redirect_uri") !== app.redirectUri ||
    params.get("code_challenge_method") !== "S256" ||
    !/^[A-Za-z0-9_-]{32,128}$/.test(state) ||
    !/^[A-Za-z0-9_-]{43}$/.test(challenge)
  )
    invalid();
  return {
    clientId: app.id,
    redirectUri: app.redirectUri,
    state,
    codeChallenge: challenge,
  };
}
function consentKey() {
  const key = process.env.SESSION_SECRET;
  if (!key || key.length < 32)
    throw new Error("Configuration de session manquante");
  return key;
}
const binding = (cookie: string) =>
  createHash("sha256").update(cookie).digest("hex");
export function consentIntent(
  request: HubRequest,
  userId: string,
  cookie: string,
) {
  const body = Buffer.from(
    JSON.stringify({
      ...request,
      userId,
      binding: binding(cookie),
      nonce: randomBytes(24).toString("base64url"),
      expires: Date.now() + 600000,
    }),
  ).toString("base64url");
  return (
    body +
    "." +
    createHmac("sha256", consentKey()).update(body).digest("base64url")
  );
}
export function readConsentIntent(
  value: string,
  userId: string,
  cookie: string,
) {
  if (typeof value !== "string" || value.length > 4096) invalid();
  const [body, signature, extra] = value.split(".");
  if (!body || !signature || extra) invalid();
  const supplied = Buffer.from(signature, "base64url"),
    expected = createHmac("sha256", consentKey()).update(body).digest();
  if (
    supplied.length !== expected.length ||
    !timingSafeEqual(supplied, expected)
  )
    invalid();
  let parsed;
  try {
    parsed = JSON.parse(Buffer.from(body, "base64url").toString("utf8"));
  } catch {
    invalid();
  }
  if (
    parsed.userId !== userId ||
    parsed.binding !== binding(cookie) ||
    !Number.isFinite(parsed.expires) ||
    parsed.expires <= Date.now() ||
    typeof parsed.nonce !== "string"
  )
    invalid();
  const params = new URLSearchParams({
    client_id: parsed.clientId,
    redirect_uri: parsed.redirectUri,
    state: parsed.state,
    code_challenge: parsed.codeChallenge,
    code_challenge_method: "S256",
  });
  return { ...parseHubRequest(params), nonce: parsed.nonce };
}
export async function authorizeHub(
  request: ReturnType<typeof readConsentIntent>,
  userId: string,
  vehicleIds: string[],
) {
  const unique = [...new Set(vehicleIds)];
  if (
    !unique.length ||
    unique.length > 500 ||
    unique.some((id) => typeof id !== "string" || !id || id.length > 100)
  )
    invalid();
  const owned = await db.vehicle.count({
    where: { userId, id: { in: unique } },
  });
  if (owned !== unique.length) invalid();
  const code = randomBytes(32).toString("base64url");
  await db.hubAuthorization.deleteMany({
    where: { expiresAt: { lte: new Date() } },
  });
  await db.hubAuthorization.create({
    data: {
      codeHash: hashHubToken(code),
      nonce: request.nonce,
      userId,
      clientId: request.clientId,
      redirectUri: request.redirectUri,
      codeChallenge: request.codeChallenge,
      vehicleIds: JSON.stringify(unique),
      expiresAt: new Date(Date.now() + 600000),
    },
  });
  const target = new URL(request.redirectUri);
  target.searchParams.set("code", code);
  target.searchParams.set("state", request.state);
  return target;
}
export async function exchangeHubCode(body: Record<string, unknown>) {
  const fields = [
    "grant_type",
    "code",
    "client_id",
    "redirect_uri",
    "code_verifier",
    "subject",
  ];
  if (
    !body ||
    typeof body !== "object" ||
    Array.isArray(body) ||
    Object.keys(body).some((key) => !fields.includes(key))
  )
    invalid();
  const app = hubApplication();
  if (
    body.grant_type !== "authorization_code" ||
    body.client_id !== app.id ||
    body.redirect_uri !== app.redirectUri ||
    typeof body.code !== "string" ||
    !/^[A-Za-z0-9_-]{43}$/.test(body.code) ||
    typeof body.code_verifier !== "string" ||
    !/^[A-Za-z0-9._~-]{43,128}$/.test(body.code_verifier) ||
    typeof body.subject !== "string"
  )
    invalid();
  const hash = hashHubToken(body.code as string),
    challenge = createHash("sha256")
      .update(body.code_verifier as string)
      .digest("base64url");
  const now = new Date(),
    token = `drv_app_${randomBytes(32).toString("base64url")}`,
    expiresAt = new Date(now.getTime() + HUB_TOKEN_DAYS * 86400000);
  return db.$transaction(async (tx) => {
    const code = await tx.hubAuthorization.findUnique({
      where: { codeHash: hash },
      include: { user: { select: { kyrosSubject: true } } },
    });
    if (
      !code ||
      code.consumedAt ||
      code.expiresAt <= now ||
      code.clientId !== app.id ||
      code.redirectUri !== app.redirectUri ||
      code.codeChallenge !== challenge
    )
      throw new HubAuthorizationError("INVALID_GRANT");
    if (code.user.kyrosSubject !== body.subject)
      throw new HubAuthorizationError("ACCOUNT_MISMATCH", 403);
    const consumed = await tx.hubAuthorization.updateMany({
      where: { codeHash: hash, consumedAt: null, expiresAt: { gt: now } },
      data: { consumedAt: now },
    });
    if (consumed.count !== 1) throw new HubAuthorizationError("INVALID_GRANT");
    await tx.hubApplication.upsert({
      where: { userId_clientId: { userId: code.userId, clientId: app.id } },
      create: {
        userId: code.userId,
        clientId: app.id,
        vehicleIds: code.vehicleIds,
        tokenHash: hashHubToken(token),
        expiresAt,
      },
      update: {
        vehicleIds: code.vehicleIds,
        tokenHash: hashHubToken(token),
        expiresAt,
        revokedAt: null,
        createdAt: now,
      },
    });
    return {
      access_token: token,
      token_type: "Bearer",
      scope: "widgets:read",
      expiresAt: expiresAt.toISOString(),
      subject: code.user.kyrosSubject,
    };
  });
}
export function allowedHubVehicles(value: string) {
  try {
    const ids = JSON.parse(value);
    return Array.isArray(ids) &&
      ids.length <= 500 &&
      ids.every((id) => typeof id === "string")
      ? (ids as string[])
      : [];
  } catch {
    return [];
  }
}
