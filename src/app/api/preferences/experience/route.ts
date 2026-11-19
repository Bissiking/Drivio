import { NextResponse } from "next/server";
import { apiError, apiUser } from "@/lib/api";
import { db } from "@/lib/db";
import { experienceSchema } from "@/lib/experience";

export async function PATCH(request: Request) {
  const user = await apiUser();
  if (!user) return NextResponse.json({ error: "Session expirée." }, { status: 401 });
  const origin = request.headers.get("origin");
  if (origin && origin !== new URL(process.env.NEXT_PUBLIC_APP_URL ?? request.url).origin) return NextResponse.json({ error: "Origine refusée." }, { status: 403 });
  try {
    const data = experienceSchema.parse(await request.json());
    await db.user.update({ where: { id: user.id }, data });
    return NextResponse.json({ ok: true }, { headers: { "Cache-Control": "private, no-store" } });
  } catch (error) { return apiError(error); }
}
