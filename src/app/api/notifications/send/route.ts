import { NextResponse } from "next/server";
import { apiUser } from "@/lib/api";
import { sendNotifications } from "@/lib/gotify";
export async function POST() {
  const user = await apiUser();
  if (!user) return NextResponse.json({ error: "Session expirée." }, { status: 401 });
  try { return NextResponse.json(await sendNotifications(user.id)); }
  catch { return NextResponse.json({ error: "Impossible de traiter les notifications." }, { status: 500 }); }
}
