import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";
import { KyrosTokenError, refreshKyrosTokens } from "./kyros";

const tokenPair = {
  access_token: "access-token",
  expires_in: 900,
  refresh_token: "rotated-refresh-token",
  refresh_token_expires_at: "2026-10-09T12:00:00.000Z",
};

describe("rotation de session Kyros", () => {
  beforeEach(() => {
    vi.stubEnv("KYROS_BASE_URL", "https://kyros.test");
    vi.stubEnv("KYROS_CLIENT_ID", "drivio-test");
    vi.stubEnv("NEXT_PUBLIC_APP_URL", "https://drivio.test");
  });

  afterEach(() => {
    vi.unstubAllEnvs();
    vi.unstubAllGlobals();
  });

  it("sérialise deux rotations concurrentes du même refresh token", async () => {
    const fetchMock = vi.fn().mockResolvedValue(Response.json(tokenPair));
    vi.stubGlobal("fetch", fetchMock);

    const [first, second] = await Promise.all([
      refreshKyrosTokens("refresh-concurrent-a"),
      refreshKyrosTokens("refresh-concurrent-a"),
    ]);

    expect(first.refresh_token).toBe(tokenPair.refresh_token);
    expect(second).toEqual(first);
    expect(fetchMock).toHaveBeenCalledTimes(1);
    expect(JSON.parse(fetchMock.mock.calls[0][1].body)).toMatchObject({
      grant_type: "refresh_token",
      refresh_token: "refresh-concurrent-a",
      kyros_sso_version: "v4",
    });
  });

  it("classe une indisponibilité Kyros comme temporaire", async () => {
    vi.stubGlobal("fetch", vi.fn().mockRejectedValue(new TypeError("network down")));

    await expect(refreshKyrosTokens("refresh-network-b")).rejects.toMatchObject({
      name: "KyrosTokenError",
      retryable: true,
    } satisfies Partial<KyrosTokenError>);
  });

  it("classe un refresh révoqué comme une session expirée", async () => {
    vi.stubGlobal("fetch", vi.fn().mockResolvedValue(Response.json({ error: "invalid_refresh_token" }, { status: 400 })));

    await expect(refreshKyrosTokens("refresh-revoked-c")).rejects.toMatchObject({
      name: "KyrosTokenError",
      code: "invalid_refresh_token",
      retryable: false,
    } satisfies Partial<KyrosTokenError>);
  });
});
