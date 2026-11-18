import { NextResponse } from "next/server";
import { apiError, apiUser } from "@/lib/api";
import { db } from "@/lib/db";
type Context = { params: Promise<{ id: string }> };
export async function POST(_request: Request, { params }: Context) {
  const user = await apiUser(); if (!user) return NextResponse.json({ error: "Session expirée." }, { status: 401 });
  try {
    const { id } = await params, email = user.email?.trim().toLowerCase();
    if (!email) return NextResponse.json({ error: "Votre compte Kyros doit transmettre une adresse e-mail pour accepter une invitation." }, { status: 403 });
    const invite = await db.vehicleShare.findFirst({ where: { id, email, acceptedAt: null } });
    if (!invite) return NextResponse.json({ error: "Invitation introuvable." }, { status: 404 });
    const result = await db.$transaction(async tx => {
      const vehicle = await tx.vehicle.update({ where: { id: invite.vehicleId }, data: { updatedAt: new Date() } });
      if (vehicle.userId === user.id) return 0;
      if (await tx.vehicleShare.findFirst({ where: { vehicleId: invite.vehicleId, recipientId: user.id, acceptedAt: { not: null } } })) return "ALREADY_ACCEPTED";
      return (await tx.vehicleShare.updateMany({ where: { id, email, acceptedAt: null, expiresAt: { gt: new Date() } }, data: { recipientId: user.id, acceptedAt: new Date() } })).count;
    });
    if (result === "ALREADY_ACCEPTED") return NextResponse.json({ error: "Votre compte a déjà accès à ce véhicule. Le propriétaire peut modifier ses droits existants." }, { status: 409 });
    return result ? NextResponse.json({ ok: true }) : NextResponse.json({ error: "Cette invitation a expiré ou a été retirée. Demandez une nouvelle invitation." }, { status: 409 });
  } catch (error) { return apiError(error); }
}
export async function DELETE(_request: Request, { params }: Context) {
  const user = await apiUser(); if (!user) return NextResponse.json({ error: "Session expirée." }, { status: 401 });
  try {
    const { id } = await params;
    const removed = await db.vehicleShare.deleteMany({ where: { id, OR: [{ recipientId: user.id }, { email: user.email?.trim().toLowerCase() ?? "", acceptedAt: null }] } });
    return removed.count ? NextResponse.json({ ok: true }) : NextResponse.json({ error: "Partage introuvable." }, { status: 404 });
  } catch (error) { return apiError(error); }
}
