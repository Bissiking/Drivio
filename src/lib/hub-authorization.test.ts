import { beforeAll, afterAll, describe, it, expect, vi } from "vitest";
import { createHash } from "node:crypto";
import { testDatabase } from "@/test/database";
const state = vi.hoisted(() => ({
  db: null as unknown as import("@/generated/prisma/client").PrismaClient,
  userId: "owner" as string | null,
}));
vi.mock("@/lib/db", () => ({
  get db() {
    return state.db;
  },
}));
vi.mock("@/lib/auth", () => ({
  getCurrentUser: async () => (state.userId ? { id: state.userId } : null),
  SESSION_COOKIE: "drivio_session",
}));
vi.mock("next/headers", () => ({
  cookies: async () => ({ get: () => ({ value: "browser-binding" }) }),
}));
import {
  parseHubRequest,
  consentIntent,
  readConsentIntent,
  authorizeHub,
  exchangeHubCode,
} from "./hub-authorization";
import { safeConsentReturn } from "./return-to";
import { readHubBody } from "./hub-body";
import { GET as vehicles } from "@/app/api/hub/v1/vehicles/route";
import { GET as summary } from "@/app/api/hub/v1/summary/route";
import { POST as consent } from "@/app/api/hub/authorize/route";
import { POST as revoke } from "@/app/api/hub/revoke/route";
import { DELETE as revokeApplication } from "@/app/api/preferences/hub/applications/route";
let fixture: Awaited<ReturnType<typeof testDatabase>>;
const verifier = "x".repeat(43),
  challenge = createHash("sha256").update(verifier).digest("base64url");
function request() {
  return parseHubRequest(
    new URLSearchParams({
      client_id: "luma-hub",
      redirect_uri: "http://localhost:3000/api/connectors/drivio/callback",
      state: "s".repeat(43),
      code_challenge: challenge,
      code_challenge_method: "S256",
    }),
  );
}
async function issue(ids = ["car"]) {
  const intent = readConsentIntent(
    consentIntent(request(), "owner", "browser-binding"),
    "owner",
    "browser-binding",
  );
  const target = await authorizeHub(intent, "owner", ids);
  return {
    grant_type: "authorization_code",
    client_id: "luma-hub",
    redirect_uri: request().redirectUri,
    code: target.searchParams.get("code"),
    code_verifier: verifier,
    subject: "kyros-owner",
  };
}
beforeAll(async () => {
  vi.stubEnv("LUMA_HUB_URL", "http://localhost:3000");
  vi.stubEnv(
    "SESSION_SECRET",
    "consent-test-session-secret-at-least-32-characters",
  );
  fixture = await testDatabase();
  state.db = fixture.client;
  await state.db.user.createMany({
    data: [
      { id: "owner", kyrosSubject: "kyros-owner" },
      { id: "other", kyrosSubject: "kyros-other" },
    ],
  });
  for (const [id, userId] of [
    ["car", "owner"],
    ["unshared", "owner"],
    ["foreign", "other"],
  ])
    await state.db.vehicle.create({
      data: {
        id,
        userId,
        brand: "Test",
        model: id,
        trim: "V",
        year: 2024,
        purchaseDate: new Date("2026-01-01"),
        purchaseMileage: 1000,
      },
    });
});
afterAll(async () => {
  vi.unstubAllEnvs();
  await fixture.close();
});
describe.sequential("Consentement Drivio pour applications", () => {
  it("borne les corps en octets avant parsing", async () => {
    expect(
      await readHubBody(
        new Request("http://localhost", { method: "POST", body: "valid" }),
        5,
      ),
    ).toBe("valid");
    await expect(
      readHubBody(
        new Request("http://localhost", { method: "POST", body: "ééé" }),
        5,
      ),
    ).rejects.toThrow();
  });
  it("refuse client, callback, challenge ou paramètres ambigus", () => {
    for (const [key, value] of [
      ["client_id", "evil"],
      ["redirect_uri", "https://evil.test"],
      ["code_challenge", "short"],
      ["code_challenge_method", "plain"],
      ["state", "x"],
    ]) {
      const params = new URLSearchParams({
        client_id: "luma-hub",
        redirect_uri: request().redirectUri,
        state: "s".repeat(43),
        code_challenge: challenge,
        code_challenge_method: "S256",
      });
      params.set(key, value);
      expect(() => parseHubRequest(params)).toThrow();
    }
    const params = new URLSearchParams({
      client_id: "luma-hub",
      redirect_uri: request().redirectUri,
      state: "s".repeat(43),
      code_challenge: challenge,
      code_challenge_method: "S256",
    });
    params.append("state", "other");
    expect(() => parseHubRequest(params)).toThrow();
  });
  it("lie le consentement à la session Drivio et au propriétaire", () => {
    const value = consentIntent(request(), "owner", "browser-binding");
    expect(readConsentIntent(value, "owner", "browser-binding").clientId).toBe(
      "luma-hub",
    );
    for (const [id, cookie] of [
      ["other", "browser-binding"],
      ["owner", "another-browser"],
    ])
      expect(() => readConsentIntent(value, id, cookie)).toThrow();
    expect(() =>
      readConsentIntent(value + "x", "owner", "browser-binding"),
    ).toThrow();
  });
  it("ne partage que les véhicules choisis et jamais ceux d’un tiers", async () => {
    await expect(issue(["foreign"])).rejects.toThrow();
    await expect(issue([])).rejects.toThrow();
    const body = await issue();
    await expect(
      exchangeHubCode({ ...body, subject: "kyros-other" }),
    ).rejects.toMatchObject({ code: "ACCOUNT_MISMATCH" });
    await expect(
      exchangeHubCode({ ...body, code_verifier: "y".repeat(43) }),
    ).rejects.toMatchObject({ code: "INVALID_GRANT" });
    const token = await exchangeHubCode(body);
    expect(token.access_token).toMatch(/^drv_app_[A-Za-z0-9_-]{43}$/);
    const stored = await state.db.hubApplication.findFirstOrThrow();
    expect(stored.tokenHash).not.toContain(token.access_token);
    expect(stored.vehicleIds).toBe('["car"]');
    const headers = { authorization: `Bearer ${token.access_token}` };
    expect(
      (
        await (
          await vehicles(
            new Request("http://localhost/api/hub/v1/vehicles", { headers }),
          )
        ).json()
      ).vehicles.map((v: { id: string }) => v.id),
    ).toEqual(["car"]);
    for (const id of ["unshared", "foreign", "unknown"])
      expect(
        (
          await summary(
            new Request("http://localhost/api/hub/v1/summary?vehicle=" + id, {
              headers,
            }),
          )
        ).status,
      ).toBe(404);
    await expect(exchangeHubCode(body)).rejects.toMatchObject({
      code: "INVALID_GRANT",
    });
    expect(
      (
        await revoke(
          new Request("http://localhost/api/hub/revoke", {
            method: "POST",
            headers,
          }),
        )
      ).status,
    ).toBe(200);
    expect(
      (
        await vehicles(
          new Request("http://localhost/api/hub/v1/vehicles", { headers }),
        )
      ).status,
    ).toBe(401);
  });
  it("consomme un code une seule fois même en concurrence, et refuse son expiration", async () => {
    const body = await issue();
    const results = await Promise.allSettled([
      exchangeHubCode(body),
      exchangeHubCode(body),
    ]);
    expect(results.filter((r) => r.status === "fulfilled")).toHaveLength(1);
    const expired = await issue();
    await state.db.hubAuthorization.updateMany({
      where: { consumedAt: null },
      data: { expiresAt: new Date(0) },
    });
    await expect(exchangeHubCode(expired)).rejects.toMatchObject({
      code: "INVALID_GRANT",
    });
  });
  it("demande une session et une origine légitimes pour consentir ou révoquer", async () => {
    state.userId = null;
    expect(
      (
        await consent(
          new Request("http://localhost/api/hub/authorize", { method: "POST" }),
        )
      ).status,
    ).toBe(401);
    state.userId = "owner";
    expect(
      (
        await consent(
          new Request("http://localhost/api/hub/authorize", {
            method: "POST",
            headers: { origin: "https://evil.test" },
          }),
        )
      ).status,
    ).toBe(403);
    const form = new FormData();
    form.set("intent", consentIntent(request(), "owner", "browser-binding"));
    form.set("decision", "deny");
    const denied = await consent(
      new Request("http://localhost/api/hub/authorize", {
        method: "POST",
        headers: { origin: "http://localhost" },
        body: form,
      }),
    );
    expect(denied.status).toBe(303);
    expect(
      new URL(denied.headers.get("location")!).searchParams.get("error"),
    ).toBe("access_denied");
    const grant = await state.db.hubApplication.findFirstOrThrow();
    state.userId = "other";
    expect(
      (
        await revokeApplication(
          new Request(
            "http://localhost/api/preferences/hub/applications?id=" + grant.id,
            { method: "DELETE", headers: { origin: "http://localhost" } },
          ),
        )
      ).status,
    ).toBe(404);
    state.userId = "owner";
  });
  it("préserve uniquement le retour local de consentement après connexion Kyros", () => {
    expect(safeConsentReturn("/hub/authorize?state=test")).toBe(
      "/hub/authorize?state=test",
    );
    for (const value of [
      "//evil.test",
      "https://evil.test",
      "/\\evil.test",
      "/hub/authorize#x",
      "/dashboard",
      "/hub/authorize\n",
    ])
      expect(safeConsentReturn(value)).toBeNull();
  });
});
