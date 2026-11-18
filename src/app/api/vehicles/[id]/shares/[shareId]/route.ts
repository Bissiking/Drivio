import { NextResponse } from "next/server";
import { apiError, apiUser } from "@/lib/api";
import { manageVehicleShare, shareRightsSchema } from "@/lib/vehicle-sharing";
type Context = { params: Promise<{ id: string; shareId: string }> };
export async function PATCH(request: Request, { params }: Context) {
  const user = await apiUser(); if (!user) return NextResponse.json({ error: "Session expirée." }, { status: 401 });
  try {
    const { id, shareId } = await params, data = shareRightsSchema.parse(await request.json());
    const result = await manageVehicleShare(user.id, id, tx => tx.vehicleShare.updateMany({ where: { id: shareId, vehicleId: id }, data }));
    return (result as { count: number }).count ? NextResponse.json({ ok: true }) : NextResponse.json({ error: "Partage introuvable." }, { status: 404 });
  } catch (error) { return apiError(error); }
}
export async function DELETE(_request: Request, { params }: Context) {
  const user = await apiUser(); if (!user) return NextResponse.json({ error: "Session expirée." }, { status: 401 });
  try {
    const { id, shareId } = await params;
    const result = await manageVehicleShare(user.id, id, tx => tx.vehicleShare.deleteMany({ where: { id: shareId, vehicleId: id } }));
    return (result as { count: number }).count ? NextResponse.json({ ok: true }) : NextResponse.json({ error: "Partage introuvable." }, { status: 404 });
  } catch (error) { return apiError(error); }
}
