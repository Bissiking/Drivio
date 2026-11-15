// src/app/api/aion/jobs/route.ts
import { NextResponse } from "next/server";
import { aionAuthorized, aionDenied, fuelPriceJob } from "@/lib/aion";
export async function GET(request: Request) { return aionAuthorized(request) ? NextResponse.json({ jobs: [fuelPriceJob] }, { headers: { "Cache-Control": "no-store" } }) : aionDenied(); }
