import { createHash, randomBytes } from "node:crypto";
import { NextResponse } from "next/server";
import { db } from "./db";

export const HUB_SCOPE = "widgets:read";
export const HUB_TOKEN_DAYS = 90;
export function hashHubToken(token: string) { return createHash("sha256").update(token).digest("hex"); }
export function newHubToken(now = new Date()) {
  const token = `drv_hub_${randomBytes(32).toString("base64url")}`;
  return { token, hash: hashHubToken(token), expiresAt: new Date(now.getTime() + HUB_TOKEN_DAYS * 86_400_000) };
}

export function hubJson(data: unknown, status = 200) {
  return NextResponse.json(data, { status, headers: {
    "Cache-Control": "private, no-store", "Vary": "Authorization", "X-Content-Type-Options": "nosniff",
    ...(status === 401 ? { "WWW-Authenticate": 'Bearer realm="Drivio Hub", error="invalid_token"' } : {}),
  } });
}
export async function hubUser(request: Request) {
  const match = /^Bearer (drv_(?:hub|app)_[A-Za-z0-9_-]{43})$/i.exec(request.headers.get("authorization") ?? "");
  if (!match) return null;
  if(match[1].startsWith('drv_app_')) {
    const grant=await db.hubApplication.findFirst({where:{tokenHash:hashHubToken(match[1]),expiresAt:{gt:new Date()},revokedAt:null},select:{userId:true,vehicleIds:true}});
    if(!grant)return null;
    try { const ids=JSON.parse(grant.vehicleIds); if(!Array.isArray(ids)||ids.length>500||!ids.every(id=>typeof id==='string'))return null;return {id:grant.userId,vehicleIds:ids as string[]}; }catch{return null;}
  }
  const user=await db.user.findFirst({
    where: { hubTokenHash: hashHubToken(match[1]), hubTokenExpiresAt: { gt: new Date() } },
    select: { id: true },
  });
  return user ? {...user,vehicleIds:null} : null;
}
export function hubUnauthorized() { return hubJson({ error: { code: "UNAUTHORIZED", message: "Un jeton Hub valide est requis." } }, 401); }
export function hubFailure() { return hubJson({ error: { code: "INTERNAL_ERROR", message: "Le service Hub est indisponible." } }, 500); }
