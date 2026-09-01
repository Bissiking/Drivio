// src/app/api/upload/route.ts
import { randomUUID } from "node:crypto";
import { mkdir, writeFile } from "node:fs/promises";
import path from "node:path";
import { NextRequest, NextResponse } from "next/server";
import { apiError, apiUser } from "@/lib/api";

const allowed = new Map([["image/jpeg", "jpg"], ["image/png", "png"], ["image/webp", "webp"]]);

export async function POST(request: NextRequest) {
  if (!(await apiUser())) return NextResponse.json({ error: "Session expirée." }, { status: 401 });
  try {
    const data = await request.formData();
    const file = data.get("file");
    if (!(file instanceof File)) return NextResponse.json({ error: "Aucun fichier reçu." }, { status: 400 });
    const extension = allowed.get(file.type);
    if (!extension) return NextResponse.json({ error: "Format accepté : JPG, PNG ou WebP." }, { status: 415 });
    if (file.size > 5 * 1024 * 1024) return NextResponse.json({ error: "La photo ne doit pas dépasser 5 Mo." }, { status: 413 });
    const name = `${randomUUID()}.${extension}`;
    const directory = path.join(process.cwd(), "public", "uploads");
    await mkdir(directory, { recursive: true });
    await writeFile(path.join(directory, name), Buffer.from(await file.arrayBuffer()));
    return NextResponse.json({ path: `/uploads/${name}` }, { status: 201 });
  } catch (error) {
    return apiError(error);
  }
}
