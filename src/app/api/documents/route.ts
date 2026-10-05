import { randomUUID } from "node:crypto";
import { mkdir, unlink, writeFile } from "node:fs/promises";
import path from "node:path";
import { NextRequest, NextResponse } from "next/server";
import { apiError, apiUser, ownedVehicle } from "@/lib/api";
import { db } from "@/lib/db";
import { documentSchema } from "@/lib/validations";
import { detectFileType, documentDirectory } from "@/lib/uploads";
export const runtime = "nodejs";
export async function POST(request: NextRequest) {
  const user = await apiUser();
  if (!user) return NextResponse.json({ error: "Session expirée." }, { status: 401 });
  try {
    const form = await request.formData(), data = documentSchema.parse(Object.fromEntries(form));
    if (!await ownedVehicle(user.id, data.vehicleId)) return NextResponse.json({ error: "Véhicule introuvable." }, { status: 404 });
    const file = form.get("file");
    if (!(file instanceof File) || file.size === 0) return NextResponse.json({ error: "Choisissez un document." }, { status: 400 });
    if (file.size > 10 * 1024 * 1024) return NextResponse.json({ error: "Le document ne doit pas dépasser 10 Mo." }, { status: 413 });
    const buffer = Buffer.from(await file.arrayBuffer()), type = detectFileType(buffer);
    if (!type || type.mime !== file.type) return NextResponse.json({ error: "Fichier invalide : PDF, JPG, PNG ou WebP attendu." }, { status: 415 });
    const storageKey = `${randomUUID()}.${type.extension}`, directory = documentDirectory();
    await mkdir(directory, { recursive: true });
    await writeFile(path.join(/* turbopackIgnore: true */ directory, storageKey), buffer, { flag: "wx", mode: 0o600 });
    try {
      const document = await db.vehicleDocument.create({ data: { ...data, storageKey, originalName: path.basename(file.name).replace(/[\r\n]/g, ""), mimeType: type.mime, size: file.size } });
      return NextResponse.json({ document: { id: document.id, title: document.title } }, { status: 201 });
    } catch (error) { await unlink(path.join(/* turbopackIgnore: true */ directory, storageKey)); throw error; }
  } catch (error) { return apiError(error); }
}
