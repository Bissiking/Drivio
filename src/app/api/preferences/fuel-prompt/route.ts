// src/app/api/preferences/fuel-prompt/route.ts
import { NextResponse } from "next/server";
import { z } from "zod";
import { apiError, apiUser } from "@/lib/api";
import { getSession } from "@/lib/auth";
import { db } from "@/lib/db";
export async function POST(request: Request) {
  const user = await apiUser(), session = await getSession();
  if (!user || !session) return NextResponse.json({ error: "Session expirée." }, { status: 401 });
  try {
    const { device } = z.object({ device: z.enum(["mobile", "desktop"]) }).parse(await request.json());
    if (!session.loginId || !(device === "mobile" ? user.autoFuelMobile : user.autoFuelDesktop)) return NextResponse.json({ open: false });
    // The unique session claim is durable across tabs, navigation and token rotation.
    try { await db.fuelPromptClaim.create({ data: { sessionId: session.loginId, userId: user.id, expiresAt: new Date(session.refreshExpiresAt) } }); }
    catch (error) { if (error && typeof error === "object" && "code" in error && error.code === "P2002") return NextResponse.json({ open: false }); throw error; }
    return NextResponse.json({ open: true });
  } catch (error) { return apiError(error); }
}
