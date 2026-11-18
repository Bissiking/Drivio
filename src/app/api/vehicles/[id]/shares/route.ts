import { NextResponse } from "next/server";
import { apiError, apiUser } from "@/lib/api";
import { manageVehicleShare, shareInviteSchema } from "@/lib/vehicle-sharing";
type Context = { params: Promise<{ id: string }> };
export async function POST(request: Request, { params }: Context) {
  const user = await apiUser(); if (!user) return NextResponse.json({ error: "Session expirée." }, { status: 401 });
  try {
    const { id } = await params, data = shareInviteSchema.parse(await request.json());
    if (data.email === user.email?.trim().toLowerCase()) return NextResponse.json({ error: "Ce véhicule vous appartient déjà." }, { status: 400 });
    const result = await manageVehicleShare(user.id, id, async tx => {
      const existing = await tx.vehicleShare.findUnique({ where: { vehicleId_email: { vehicleId: id, email: data.email } } });
      if (existing?.acceptedAt) return null;
      return tx.vehicleShare.upsert({ where: { vehicleId_email: { vehicleId: id, email: data.email } }, create: { vehicleId: id, ...data, expiresAt: new Date(Date.now() + 7 * 86400000) }, update: { ...data, expiresAt: new Date(Date.now() + 7 * 86400000) } });
    });
    if (!result) return NextResponse.json({ error: "Cet accès est déjà actif. Modifiez ses droits dans la liste." }, { status: 409 });
    return NextResponse.json({ ok: true }, { status: 201 });
  } catch (error) { return apiError(error); }
}
