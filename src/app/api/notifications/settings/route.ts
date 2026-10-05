import { NextRequest, NextResponse } from "next/server";
import { apiError, apiUser } from "@/lib/api";
import { db } from "@/lib/db";
import { encryptGotifyToken } from "@/lib/gotify";
import { notificationSchema } from "@/lib/validations";
export async function POST(request: NextRequest) {
  const user = await apiUser();
  if (!user) return NextResponse.json({ error: "Session expirée." }, { status: 401 });
  try {
    const { token, clearToken, enabledTypes, ...preferences } = notificationSchema.parse(await request.json());
    const data = { ...preferences, enabledTypes: enabledTypes.join(",") };
    const tokenEncrypted = clearToken ? null : token?.trim() ? encryptGotifyToken(token.trim()) : undefined;
    const existing = await db.notificationSettings.findUnique({ where: { userId: user.id } });
    if (data.enabled && !(tokenEncrypted ?? (!clearToken && existing?.tokenEncrypted))) return NextResponse.json({ error: "Renseignez un token d’application Gotify avant d’activer les notifications." }, { status: 400 });
    await db.notificationSettings.upsert({ where: { userId: user.id }, create: { userId: user.id, ...data, tokenEncrypted }, update: { ...data, tokenEncrypted } });
    return NextResponse.json({ ok: true });
  } catch (error) { return apiError(error); }
}
