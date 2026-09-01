// src/lib/auth.ts
import { cookies } from "next/headers";
import { redirect } from "next/navigation";
import { jwtVerify, SignJWT } from "jose";
import { db } from "./db";

export const SESSION_COOKIE = "drivio_session";

function secret() {
  const value = process.env.SESSION_SECRET;
  if (!value || value.length < 32) throw new Error("SESSION_SECRET doit contenir au moins 32 caractères.");
  return new TextEncoder().encode(value);
}

export async function createSessionToken(userId: string, subject: string) {
  return new SignJWT({ uid: userId })
    .setProtectedHeader({ alg: "HS256" })
    .setSubject(subject)
    .setIssuedAt()
    .setExpirationTime("8h")
    .sign(secret());
}

export async function getCurrentUser() {
  const token = (await cookies()).get(SESSION_COOKIE)?.value;
  if (!token) return null;
  try {
    const { payload } = await jwtVerify(token, secret(), { algorithms: ["HS256"] });
    if (typeof payload.uid !== "string" || typeof payload.sub !== "string") return null;
    return db.user.findFirst({ where: { id: payload.uid, kyrosSubject: payload.sub } });
  } catch {
    return null;
  }
}

export async function requirePageUser() {
  const user = await getCurrentUser();
  if (!user) redirect("/connexion");
  return user;
}
