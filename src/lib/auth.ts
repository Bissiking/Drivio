import { createHash } from "node:crypto";
import { cookies } from "next/headers";
import { redirect } from "next/navigation";
import { EncryptJWT, jwtDecrypt, jwtVerify } from "jose";
import { db } from "./db";

export const SESSION_COOKIE = "drivio_session";

export type DrivioSession = {
  userId: string;
  subject: string;
  refreshToken: string;
  accessExpiresAt: number;
  refreshExpiresAt: number;
};

function sessionSecret() {
  const value = process.env.SESSION_SECRET;
  if (!value || value.length < 32) throw new Error("SESSION_SECRET doit contenir au moins 32 caractères.");
  return value;
}

function signingKey() {
  return new TextEncoder().encode(sessionSecret());
}

function encryptionKey() {
  return createHash("sha256").update(sessionSecret()).digest();
}

export async function createSessionToken(session: DrivioSession) {
  return new EncryptJWT({ uid: session.userId, rt: session.refreshToken, aexp: session.accessExpiresAt, rexp: session.refreshExpiresAt })
    .setProtectedHeader({ alg: "dir", enc: "A256GCM" })
    .setSubject(session.subject)
    .setIssuedAt()
    .setExpirationTime(Math.floor(session.refreshExpiresAt / 1000))
    .encrypt(encryptionKey());
}

export async function readSessionToken(token: string): Promise<DrivioSession | null> {
  try {
    const { payload } = await jwtDecrypt(token, encryptionKey(), {
      keyManagementAlgorithms: ["dir"],
      contentEncryptionAlgorithms: ["A256GCM"],
    });
    if (
      typeof payload.uid !== "string" || typeof payload.sub !== "string" || typeof payload.rt !== "string" ||
      typeof payload.aexp !== "number" || typeof payload.rexp !== "number"
    ) return null;
    return { userId: payload.uid, subject: payload.sub, refreshToken: payload.rt, accessExpiresAt: payload.aexp, refreshExpiresAt: payload.rexp };
  } catch {
    return null;
  }
}

async function readLegacySessionToken(token: string) {
  try {
    const { payload } = await jwtVerify(token, signingKey(), { algorithms: ["HS256"] });
    if (typeof payload.uid !== "string" || typeof payload.sub !== "string") return null;
    return { userId: payload.uid, subject: payload.sub };
  } catch {
    return null;
  }
}

export function sessionCookieOptions(refreshExpiresAt: number) {
  return {
    httpOnly: true,
    secure: process.env.NODE_ENV === "production",
    sameSite: "lax" as const,
    path: "/",
    expires: new Date(refreshExpiresAt),
  };
}

export async function getSession() {
  const token = (await cookies()).get(SESSION_COOKIE)?.value;
  if (!token) return null;
  return readSessionToken(token);
}

export async function getCurrentUser() {
  const token = (await cookies()).get(SESSION_COOKIE)?.value;
  if (!token) return null;
  const session = await readSessionToken(token);
  const identity = session ?? await readLegacySessionToken(token);
  if (!identity) return null;
  return db.user.findFirst({ where: { id: identity.userId, kyrosSubject: identity.subject } });
}

export async function requirePageUser() {
  const user = await getCurrentUser();
  if (!user) redirect("/connexion");
  return user;
}
