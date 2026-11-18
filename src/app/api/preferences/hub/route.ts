import { apiUser } from "@/lib/api";
import { db } from "@/lib/db";
import { HUB_SCOPE, hubFailure, hubJson, newHubToken } from "@/lib/hub";

// Management requires the existing Kyros-backed session, never a Hub bearer.
export async function POST(request: Request) {
  const user = await apiUser();
  if (!user) return hubJson({ error: "Session expirée." }, 401);
  const origin = request.headers.get("origin");
  if (origin && origin !== new URL(process.env.NEXT_PUBLIC_APP_URL ?? request.url).origin) return hubJson({ error: "Origine refusée." }, 403);
  try {
    const { token, hash, expiresAt } = newHubToken();
    await db.user.update({ where: { id: user.id }, data: { hubTokenHash: hash, hubTokenExpiresAt: expiresAt } });
    return hubJson({ token, scope: HUB_SCOPE, expiresAt });
  } catch { return hubFailure(); }
}
export async function DELETE(request: Request) {
  const user = await apiUser();
  if (!user) return hubJson({ error: "Session expirée." }, 401);
  const origin = request.headers.get("origin");
  if (origin && origin !== new URL(process.env.NEXT_PUBLIC_APP_URL ?? request.url).origin) return hubJson({ error: "Origine refusée." }, 403);
  try {
    await db.user.update({ where: { id: user.id }, data: { hubTokenHash: null, hubTokenExpiresAt: null } });
    return hubJson({ ok: true });
  } catch { return hubFailure(); }
}
