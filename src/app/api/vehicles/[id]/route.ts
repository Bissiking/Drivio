// src/app/api/vehicles/[id]/route.ts
import { requireVehicleAccess, withVehicleWrite } from "@/lib/vehicle-access";
import { NextRequest, NextResponse } from "next/server";
import { apiError, apiUser } from "@/lib/api";
import { db } from "@/lib/db";
import { z } from "zod";
import { DRIVETRAINS } from "@/lib/drivetrain";

const archiveSchema = z.object({
  saleDate: z.preprocess((value) => (value === "" ? undefined : value), z.coerce.date().optional()),
  finalMileage: z.preprocess((value) => (value === "" ? undefined : value), z.coerce.number().int().nonnegative().optional()),
  salePrice: z.preprocess((value) => (value === "" ? undefined : value), z.coerce.number().nonnegative().optional()),
});

const photoSchema = z.object({
  action: z.literal("photo"),
  photoPath: z.string().startsWith("/uploads/").optional(),
  photoUrl: z.url().refine(url => /^https?:\/\//.test(url), "Utilisez une URL HTTP ou HTTPS.").optional(),
  reset: z.boolean().optional(),
}).refine((data) => data.reset || data.photoPath || data.photoUrl, { message: "Ajoutez un fichier ou une URL." });

export async function PATCH(request: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  const user = await apiUser();
  if (!user) return NextResponse.json({ error: "Session expirée." }, { status: 401 });
  try {
    const { id } = await params;
    const body = (await request.json()) as { action?: string };
    if (body.action === "primary") {
      const access = await requireVehicleAccess(user.id, id, "COMPLETE", true);
      if (!access.owner) return NextResponse.json({ error: "Seul le propriétaire peut choisir son véhicule principal." }, { status: 403 });
      await db.$transaction([
        db.vehicle.updateMany({ where: { userId: user.id }, data: { isPrimary: false } }),
        db.vehicle.update({ where: { id }, data: { isPrimary: true, status: "ACTIVE" } }),
      ]);
      return NextResponse.json({ ok: true });
    }
    return await withVehicleWrite(user.id, id, "COMPLETE", async (tx, access) => {
      if (body.action === "archive") {
        const archive = archiveSchema.parse(body);
        const vehicle = await tx.vehicle.findUniqueOrThrow({ where: { id } });
        await tx.vehicle.update({ where: { id }, data: { status: "ARCHIVED", isPrimary: false, ...archive } });
        if (vehicle.isPrimary) {
          const replacement = await tx.vehicle.findFirst({ where: { userId: access.vehicle.userId, status: "ACTIVE" }, orderBy: { createdAt: "asc" } });
          if (replacement) await tx.vehicle.update({ where: { id: replacement.id }, data: { isPrimary: true } });
        }
      } else if (body.action === "restore") {
        await tx.vehicle.update({ where: { id }, data: { status: "ACTIVE" } });
      } else if (body.action === "drivetrain") {
        const data = z.object({ drivetrain: z.enum(DRIVETRAINS) }).parse(body);
        await tx.vehicle.update({ where: { id }, data });
      } else if (body.action === "photo") {
        const photo = photoSchema.parse(body);
        await tx.vehicle.update({
          where: { id },
          data: { photoPath: photo.photoPath ?? null, photoUrl: photo.photoUrl ?? null },
        });
      } else {
        return NextResponse.json({ error: "Action inconnue." }, { status: 400 });
      }
      return NextResponse.json({ ok: true });
    });
  } catch (error) {
    return apiError(error);
  }
}
