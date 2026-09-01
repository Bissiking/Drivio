// src/app/api/vehicles/[id]/route.ts
import { NextRequest, NextResponse } from "next/server";
import { apiError, apiUser, ownedVehicle } from "@/lib/api";
import { db } from "@/lib/db";
import { z } from "zod";

const archiveSchema = z.object({
  saleDate: z.preprocess((value) => (value === "" ? undefined : value), z.coerce.date().optional()),
  finalMileage: z.preprocess((value) => (value === "" ? undefined : value), z.coerce.number().int().nonnegative().optional()),
  salePrice: z.preprocess((value) => (value === "" ? undefined : value), z.coerce.number().nonnegative().optional()),
});

const photoSchema = z.object({
  action: z.literal("photo"),
  photoPath: z.string().startsWith("/uploads/").optional(),
  photoUrl: z.url().optional(),
}).refine((data) => data.photoPath || data.photoUrl, { message: "Ajoutez un fichier ou une URL." });

export async function PATCH(request: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  const user = await apiUser();
  if (!user) return NextResponse.json({ error: "Session expirée." }, { status: 401 });
  try {
    const { id } = await params;
    if (!(await ownedVehicle(user.id, id))) return NextResponse.json({ error: "Véhicule introuvable." }, { status: 404 });
    const body = (await request.json()) as { action?: string };
    if (body.action === "primary") {
      await db.$transaction([
        db.vehicle.updateMany({ where: { userId: user.id }, data: { isPrimary: false } }),
        db.vehicle.update({ where: { id }, data: { isPrimary: true, status: "ACTIVE" } }),
      ]);
    } else if (body.action === "archive") {
      const archive = archiveSchema.parse(body);
      const vehicle = await db.vehicle.findUniqueOrThrow({ where: { id } });
      await db.vehicle.update({ where: { id }, data: { status: "ARCHIVED", isPrimary: false, ...archive } });
      if (vehicle.isPrimary) {
        const replacement = await db.vehicle.findFirst({ where: { userId: user.id, status: "ACTIVE" }, orderBy: { createdAt: "asc" } });
        if (replacement) await db.vehicle.update({ where: { id: replacement.id }, data: { isPrimary: true } });
      }
    } else if (body.action === "restore") {
      await db.vehicle.update({ where: { id }, data: { status: "ACTIVE" } });
    } else if (body.action === "photo") {
      const photo = photoSchema.parse(body);
      await db.vehicle.update({
        where: { id },
        data: { photoPath: photo.photoPath ?? null, photoUrl: photo.photoUrl ?? null },
      });
    } else {
      return NextResponse.json({ error: "Action inconnue." }, { status: 400 });
    }
    return NextResponse.json({ ok: true });
  } catch (error) {
    return apiError(error);
  }
}
