import { afterAll, beforeAll, describe, expect, it, vi } from "vitest";
import { mkdtemp, readFile, rm } from "node:fs/promises";
import path from "node:path";
import os from "node:os";
import { NextRequest } from "next/server";

const state = vi.hoisted(() => ({ directory: "", userId: "owner" as string | null }));
vi.mock("./auth", () => ({ getCurrentUser: async () => state.userId ? { id: state.userId } : null }));
vi.mock("./db", () => ({ db: {} }));
vi.mock("./uploads", async importOriginal => ({ ...await importOriginal<typeof import("./uploads")>(), photoDirectory: () => state.directory }));
import { POST as upload } from "@/app/api/upload/route";
import { GET as getPhoto } from "@/app/api/uploads/[name]/route";
import nextConfig from "../../next.config";

const png = Buffer.from("iVBORw0KGgoAAAANSUhEUgAAAAEAAAABCAQAAAC1HAwCAAAAC0lEQVR42mP8/x8AAwMCAO+jRZkAAAAASUVORK5CYII=", "base64");
const request = (file: File) => { const data = new FormData(); data.set("file", file); return new NextRequest("http://localhost/api/upload", { method: "POST", body: data }); };
const get = (name: string) => getPhoto(new Request("http://localhost/api/uploads"), { params: Promise.resolve({ name }) });
beforeAll(async () => { state.directory = await mkdtemp(path.join(os.tmpdir(), "drivio-photos-")); });
afterAll(async () => { await rm(state.directory, { recursive: true, force: true }); });

describe.sequential("photos ajoutées après le démarrage", () => {
  it("sert une photo immédiatement après l’envoi et conserve les anciennes URL /uploads", async () => {
    const response = await upload(request(new File([png], "photo.png", { type: "image/png" })));
    expect(response.status).toBe(201);
    const { path: url } = await response.json();
    expect(url).toMatch(/^\/uploads\/[\w-]+\.png$/);
    const name = path.basename(url);
    state.userId = null; // next/image fetches the source without the user's session.
    const photo = await get(name);
    state.userId = "owner";
    expect(photo.status).toBe(200); expect(photo.headers.get("content-type")).toBe("image/png");
    expect(Buffer.from(await photo.arrayBuffer())).toEqual(png);
    expect(await readFile(path.join(state.directory, name))).toEqual(png);
    expect(await nextConfig.rewrites!()).toMatchObject({ beforeFiles: [{ source: "/uploads/:name", destination: "/api/uploads/:name" }] });
  });
  it("refuse les noms de chemins et retourne 404 pour une photo absente", async () => {
    for (const name of ["../secret.png", "..\\secret.png", "photo.svg", "missing.png"]) expect((await get(name)).status).toBe(404);
  });
  it("conserve la limite de 5 Mo et la vérification du contenu", async () => {
    expect((await upload(request(new File([Buffer.alloc(5 * 1024 * 1024 + 1)], "big.png", { type: "image/png" })))).status).toBe(413);
    expect((await upload(request(new File(["<html>"], "fake.png", { type: "image/png" })))).status).toBe(415);
  });
});
