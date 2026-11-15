// src/lib/auth.test.ts
import { afterEach, describe, expect, it, vi } from "vitest";

vi.mock("./db", () => ({ db: {} }));

import { createSessionToken, readSessionToken, type DrivioSession } from "./auth";

describe("cookie de session Drivio", () => {
  afterEach(() => vi.unstubAllEnvs());

  it("chiffre le refresh token et restitue la session", async () => {
    vi.stubEnv("SESSION_SECRET", "test-secret-with-at-least-32-characters");
    const session: DrivioSession = {
      userId: "user-1",
      subject: "kyros-user-1",
      refreshToken: "private-refresh-token",
      accessExpiresAt: Date.now() + 15 * 60 * 1000,
      refreshExpiresAt: Date.now() + 30 * 24 * 60 * 60 * 1000,
    };

    const token = await createSessionToken(session);

    expect(token).not.toContain(session.refreshToken);
    await expect(readSessionToken(token)).resolves.toEqual(session);
  });

  it("rejette un cookie modifié", async () => {
    vi.stubEnv("SESSION_SECRET", "test-secret-with-at-least-32-characters");
    const token = await createSessionToken({
      userId: "user-1",
      subject: "kyros-user-1",
      refreshToken: "private-refresh-token",
      accessExpiresAt: Date.now() + 1_000,
      refreshExpiresAt: Date.now() + 60_000,
    });

    const parts = token.split(".");
    // Change significant bits of the authentication tag, never base64 padding bits.
    parts[4] = (parts[4][0] === "A" ? "B" : "A") + parts[4].slice(1);
    await expect(readSessionToken(parts.join("."))).resolves.toBeNull();
  });
  it("conserve l'identifiant de connexion pendant une rotation de jeton", async () => {
    vi.stubEnv("SESSION_SECRET", "test-secret-with-at-least-32-characters");
    const session = { userId: "user-1", subject: "kyros-user-1", refreshToken: "refresh-one", accessExpiresAt: Date.now() + 1000, refreshExpiresAt: Date.now() + 60000, loginId: "same-login" };
    const decoded = await readSessionToken(await createSessionToken(session));
    const rotated = await readSessionToken(await createSessionToken({ ...decoded!, refreshToken: "refresh-two", accessExpiresAt: Date.now() + 5000 }));
    expect(rotated?.loginId).toBe("same-login");
    expect(rotated?.refreshToken).toBe("refresh-two");
  });
});
