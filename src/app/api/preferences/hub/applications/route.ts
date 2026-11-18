import { getCurrentUser } from "@/lib/auth";
import { db } from "@/lib/db";
import { hubJson } from "@/lib/hub";
export async function DELETE(request: Request) {
  const user = await getCurrentUser();
  if (!user) return hubJson({ error: "Session expirée." }, 401);
  if (
    request.headers.get("origin") !==
    new URL(process.env.NEXT_PUBLIC_APP_URL || request.url).origin
  )
    return hubJson({ error: "Origine refusée." }, 403);
  const id = new URL(request.url).searchParams.get("id");
  if (!id || id.length > 100)
    return hubJson({ error: "Identifiant invalide." }, 400);
  const result = await db.hubApplication.updateMany({
    where: { id, userId: user.id, revokedAt: null },
    data: { revokedAt: new Date() },
  });
  return result.count
    ? hubJson({ ok: true })
    : hubJson({ error: "Accès introuvable." }, 404);
}
