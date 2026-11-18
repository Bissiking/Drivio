import { NextResponse } from "next/server";
import { apiError, apiUser } from "@/lib/api";
import { db } from "@/lib/db";
import { THEME_COOKIE, themeSchema } from "@/lib/themes";
export async function PATCH(request: Request) {
  const user = await apiUser();
  if (!user) return NextResponse.json({ error: "Session expirée." }, { status: 401 });
  try {
    const { mode, palette } = themeSchema.parse(await request.json());
    await db.user.update({ where: { id: user.id }, data: { themeMode: mode, themePalette: palette } });
    const response = NextResponse.json({ ok: true });
    response.cookies.set(THEME_COOKIE, `${mode}:${palette}`, { httpOnly: true, sameSite: "lax", secure: process.env.NODE_ENV === "production", path: "/", maxAge: 365 * 86400 });
    return response;
  } catch (error) { return apiError(error); }
}
