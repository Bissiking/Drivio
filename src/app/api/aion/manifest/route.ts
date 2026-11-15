// src/app/api/aion/manifest/route.ts
import { NextResponse } from "next/server";
import { aionAuthorized, aionDenied, aionManifest } from "@/lib/aion";
export async function GET(request: Request) { return aionAuthorized(request) ? NextResponse.json(aionManifest, { headers: { "Cache-Control": "no-store" } }) : aionDenied(); }
