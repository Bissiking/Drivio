// src/app/api/aion/jobs/[slug]/start/route.ts
import { randomUUID } from "node:crypto";
import { NextResponse } from "next/server";
import { aionAuthorized, aionDenied, fuelPriceJob } from "@/lib/aion";
import { FuelSyncBusy, syncFuelPrices } from "@/lib/fuel-sync";
export const runtime = "nodejs";
export const maxDuration = 600;
export async function POST(request: Request, context: { params: Promise<{ slug: string }> }) {
  if (!aionAuthorized(request)) return aionDenied();
  if ((await context.params).slug !== fuelPriceJob.slug) return NextResponse.json({ detail: "Job inconnu." }, { status: 404 });
  const timestamp = new Date().toISOString();
  try {
    const { executionId, stats } = await syncFuelPrices();
    return NextResponse.json({ execution_id: executionId, status: "success", exit_code: 0, message: "Import officiel terminé.", stats, logs: [{ timestamp, level: "info", message: "Téléchargement et validation du flux officiel." }, { timestamp: new Date().toISOString(), level: "info", message: JSON.stringify(stats) }] });
  } catch (error) {
    const message = error instanceof Error ? error.message : "Import impossible.";
    return NextResponse.json({ execution_id: randomUUID(), status: "failed", exit_code: 1, message, logs: [{ timestamp: new Date().toISOString(), level: "error", message }] }, { status: error instanceof FuelSyncBusy ? 409 : 500 });
  }
}
