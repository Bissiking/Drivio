import { afterEach, describe, expect, it, vi } from "vitest";
vi.mock("./db", () => ({ db: {} }));
import { decryptGotifyToken, encryptGotifyToken, pushGotify } from "./gotify";
afterEach(() => { vi.unstubAllEnvs(); vi.unstubAllGlobals(); });
describe("Gotify côté serveur", () => {
  it("chiffre les tokens avec un nonce distinct et détecte toute altération", () => {
    vi.stubEnv("SESSION_SECRET", "test-secret-at-least-thirty-two-characters-long");
    const first = encryptGotifyToken("private-token"), second = encryptGotifyToken("private-token");
    expect(first).not.toBe(second); expect(first).not.toContain("private-token"); expect(decryptGotifyToken(first)).toBe("private-token");
    const parts = first.split("."); parts[2] = "eA"; expect(() => decryptGotifyToken(parts.join("."))).toThrow();
  });
  it("envoie le token dans un en-tête et jamais dans l’URL", async () => {
    const fetchMock = vi.fn().mockResolvedValue({ ok: true }); vi.stubGlobal("fetch", fetchMock);
    await pushGotify("secret-token", "Échéance", "Entretien à venir");
    const [url, options] = fetchMock.mock.calls[0];
    expect(String(url)).toBe("https://notify.mhemery.fr/message"); expect(options.headers["X-Gotify-Key"]).toBe("secret-token"); expect(options.redirect).toBe("error");
  });
  it("ne restitue pas le contenu potentiellement sensible des erreurs fournisseur", async () => {
    vi.stubGlobal("fetch", vi.fn().mockResolvedValue({ ok: false, status: 403 }));
    await expect(pushGotify("secret", "title", "message")).rejects.toThrow("HTTP 403");
  });
});
