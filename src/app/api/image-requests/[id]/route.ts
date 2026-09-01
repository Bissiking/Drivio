// src/app/api/image-requests/[id]/route.ts
import { NextRequest, NextResponse } from "next/server";
import { z } from "zod";
import { apiError, apiUser } from "@/lib/api";
import { db } from "@/lib/db";

const resultSchema = z.object({
  action: z.literal("complete"),
  photoPath: z.string().startsWith("/uploads/").optional(),
  photoUrl: z.url().optional(),
}).refine((data) => data.photoPath || data.photoUrl, { message: "Ajoutez un fichier ou une URL." });

export async function PATCH(request: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  const user = await apiUser();
  if (!user) return NextResponse.json({ error: "Session expirée." }, { status: 401 });
  try {
    const { id } = await params;
    const imageRequest = await db.vehicleImageRequest.findFirst({ where: { id, vehicle: { userId: user.id } } });
    if (!imageRequest) return NextResponse.json({ error: "Demande introuvable." }, { status: 404 });
    const data = resultSchema.parse(await request.json());
    await db.$transaction([
      db.vehicle.update({
        where: { id: imageRequest.vehicleId },
        data: { photoPath: data.photoPath ?? null, photoUrl: data.photoUrl ?? null },
      }),
      db.vehicleImageRequest.update({
        where: { id },
        data: { status: "COMPLETED", resultPath: data.photoPath ?? null, resultUrl: data.photoUrl ?? null },
      }),
    ]);
    return NextResponse.json({ ok: true });
  } catch (error) {
    return apiError(error);
  }
}
