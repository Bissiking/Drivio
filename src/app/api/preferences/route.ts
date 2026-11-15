// src/app/api/preferences/route.ts
import { NextResponse } from "next/server";
import { z } from "zod";
import { apiError, apiUser } from "@/lib/api";
import { db } from "@/lib/db";
const flag = z.preprocess(v => v === true || v === "true" || v === "on", z.boolean());
export async function PATCH(request: Request) {
  const user = await apiUser(); if (!user) return NextResponse.json({ error: "Session expirée." }, { status: 401 });
  try { const data = z.object({ autoFuelMobile: flag, autoFuelDesktop: flag }).parse(await request.json()); await db.user.update({ where: { id: user.id }, data }); return NextResponse.json({ ok: true }); } catch (error) { return apiError(error); }
}
