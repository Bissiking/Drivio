import { readFile, unlink } from "node:fs/promises";
import path from "node:path";
import { NextRequest, NextResponse } from "next/server";
import { apiError, apiUser } from "@/lib/api";
import { db } from "@/lib/db";
import { documentDirectory } from "@/lib/uploads";
type Context = { params: Promise<{ id: string }> };
export const runtime = "nodejs";
export async function GET(_request: NextRequest, context: Context) {
  const user = await apiUser();
  if (!user) return NextResponse.json({ error: "Session expirée." }, { status: 401 });
  const document = await db.vehicleDocument.findFirst({ where: { id: (await context.params).id, vehicle: { userId: user.id } } });
  if (!document) return NextResponse.json({ error: "Document introuvable." }, { status: 404 });
  try {
    const buffer = await readFile(path.join(/* turbopackIgnore: true */ documentDirectory(), path.basename(document.storageKey)));
    return new NextResponse(new Uint8Array(buffer), { headers: { "Content-Type": document.mimeType, "Content-Disposition": `attachment; filename*=UTF-8''${encodeURIComponent(document.originalName)}`, "Cache-Control": "private, no-store", "X-Content-Type-Options": "nosniff" } });
  } catch { return NextResponse.json({ error: "Fichier indisponible sur le stockage." }, { status: 404 }); }
}
export async function DELETE(_request: NextRequest, context: Context) {
  const user = await apiUser();
  if (!user) return NextResponse.json({ error: "Session expirée." }, { status: 401 });
  const document = await db.vehicleDocument.findFirst({ where: { id: (await context.params).id, vehicle: { userId: user.id } } });
  if (!document) return NextResponse.json({ error: "Document introuvable." }, { status: 404 });
  try {
    await unlink(path.join(/* turbopackIgnore: true */ documentDirectory(), path.basename(document.storageKey))).catch((error: NodeJS.ErrnoException) => { if (error.code !== "ENOENT") throw error; });
    await db.vehicleDocument.delete({ where: { id: document.id } });
    return NextResponse.json({ ok: true });
  } catch (error) { return apiError(error); }
}
