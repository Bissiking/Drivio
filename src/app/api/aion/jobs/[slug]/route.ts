// src/app/api/aion/jobs/[slug]/route.ts
import { NextResponse } from "next/server";
import { aionAuthorized, aionDenied, fuelPriceJob } from "@/lib/aion";
export async function GET(request: Request, context: { params: Promise<{ slug: string }> }) {
  if (!aionAuthorized(request)) return aionDenied();
  return (await context.params).slug === fuelPriceJob.slug ? NextResponse.json(fuelPriceJob) : NextResponse.json({ detail: "Job inconnu." }, { status: 404 });
}
