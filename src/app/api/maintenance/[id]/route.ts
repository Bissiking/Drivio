// src/app/api/maintenance/[id]/route.ts
import { NextResponse } from "next/server";
import { apiError, apiUser } from "@/lib/api";
import { db } from "@/lib/db";

export async function PATCH(_: Request, { params }: { params: Promise<{ id: string }> }) {
  const user = await apiUser();
  if (!user) return NextResponse.json({ error: "Session expirée." }, { status: 401 });
  try {
    const { id } = await params;
    const schedule = await db.maintenanceSchedule.findFirst({ where: { id, vehicle: { userId: user.id } } });
    if (!schedule) return NextResponse.json({ error: "Échéance introuvable." }, { status: 404 });
    await db.maintenanceSchedule.update({ where: { id }, data: { completedAt: new Date() } });
    return NextResponse.json({ ok: true });
  } catch (error) {
    return apiError(error);
  }
}
