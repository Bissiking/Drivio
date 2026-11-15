// src/lib/aion.ts
import { createHash, timingSafeEqual } from "node:crypto";
import { NextResponse } from "next/server";
import { APP_VERSION } from "./version";

export function aionAuthorized(request: Request) {
  const secret = process.env.AION_API_KEY;
  if (!secret || secret.length < 32) return false;
  const hash = (value: string) => createHash("sha256").update(value).digest();
  return timingSafeEqual(hash(request.headers.get("authorization") ?? ""), hash(`Bearer ${secret}`));
}
export const aionDenied = () => NextResponse.json({ detail: "Invalid API key" }, { status: 401, headers: { "Cache-Control": "no-store" } });
export const fuelPriceJob = { slug: "fuel-prices-sync", name: "Synchronisation des prix des carburants", description: "Import différentiel du ZIP/XML officiel français. Fréquence recommandée : toutes les 15 minutes ; planification gérée par Aion.", endpoint: "/api/aion/jobs/fuel-prices-sync/start", http_method: "POST", timeout_seconds: 600, enabled: true, supports_manual_run: true, supports_stop: false, supports_schedule: true };
export const aionManifest = { aion_api_version: process.env.AION_API_VERSION ?? "1.0", module: { name: process.env.AION_MODULE_ID ?? "drivio", version: APP_VERSION }, capabilities: { jobs: true, manual_execution: true, stop_execution: false, logs: true, scheduling: true, execution_history: false, parameters: false } };
