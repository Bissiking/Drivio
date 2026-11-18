import { db } from "@/lib/db";
import { hubJson, hashHubToken } from "@/lib/hub";
export async function POST(request: Request) {
  const token = /^Bearer (drv_app_[A-Za-z0-9_-]{43})$/i.exec(
    request.headers.get("authorization") || "",
  )?.[1];
  if (!token) return hubJson({ error: { code: "UNAUTHORIZED" } }, 401);
  await db.hubApplication.updateMany({
    where: { tokenHash: hashHubToken(token), revokedAt: null },
    data: { revokedAt: new Date() },
  });
  return hubJson({ ok: true });
}
