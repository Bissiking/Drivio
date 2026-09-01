// src/app/api/auth/logout/route.ts
import { NextResponse } from "next/server";
import { SESSION_COOKIE } from "@/lib/auth";

export async function POST() {
  const response = NextResponse.redirect(new URL("/connexion", process.env.NEXT_PUBLIC_APP_URL ?? "http://localhost:3000"), 303);
  response.cookies.delete(SESSION_COOKIE);
  return response;
}
