import { readFile } from "node:fs/promises";
import path from "node:path";
import { NextResponse } from "next/server";
import { detectFileType, photoDirectory } from "@/lib/uploads";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

// Photos retain their existing public URLs, including when requested by next/image.
export async function GET(_request: Request, { params }: { params: Promise<{ name: string }> }) {
  const { name } = await params;
  if (!/^[a-zA-Z0-9_-]+\.(jpe?g|png|webp)$/i.test(name)) return NextResponse.json({ error: "Photo introuvable." }, { status: 404 });
  try {
    const buffer = await readFile(path.join(/* turbopackIgnore: true */ photoDirectory(), name));
    const type = detectFileType(buffer);
    if (!type?.mime.startsWith("image/")) return NextResponse.json({ error: "Photo invalide." }, { status: 415 });
    return new NextResponse(new Uint8Array(buffer), { headers: {
      "Content-Type": type.mime, "Cache-Control": "public, max-age=31536000, immutable", "X-Content-Type-Options": "nosniff",
    } });
  } catch (error) {
    if ((error as NodeJS.ErrnoException).code === "ENOENT") return NextResponse.json({ error: "Photo introuvable." }, { status: 404 });
    console.error("Lecture de la photo impossible", error);
    return NextResponse.json({ error: "Photo indisponible." }, { status: 500 });
  }
}
