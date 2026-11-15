// src/app/api/reports/route.ts
import { readFile } from "node:fs/promises";
import path from "node:path";
import { NextResponse } from "next/server";
import { apiUser, apiError } from "@/lib/api";
import { vehicleWorkspace } from "@/lib/vehicle-workspace";
import { generateReport, reportContent, reportSchema, type ReportAttachment } from "@/lib/reports";
import { documentDirectory } from "@/lib/uploads";
export const runtime = "nodejs";
export const maxDuration = 60;
export async function POST(request: Request) {
  const user = await apiUser(); if (!user) return NextResponse.json({ error: "Session expirée." }, { status: 401 });
  try {
    const options = reportSchema.parse(await request.json()), { vehicle } = await vehicleWorkspace(user.id, options.vehicleId);
    if (!vehicle) return NextResponse.json({ error: "Véhicule introuvable." }, { status: 404 });
    const attachments: ReportAttachment[] = []; let bytes = 0;
    for (const id of new Set(options.attachmentIds)) {
      const doc = vehicle.documents.find(d => d.id === id);
      const until = new Date(options.to); until.setUTCHours(23, 59, 59, 999);
      if (!doc || doc.date < options.from || doc.date > until) return NextResponse.json({ error: "Justificatif non autorisé pour ce véhicule et cette période." }, { status: 404 });
      bytes += doc.size; if (bytes > 30_000_000) return NextResponse.json({ error: "Les justificatifs dépassent 30 Mo." }, { status: 400 });
      const buffer = await readFile(path.join(/* turbopackIgnore: true */ documentDirectory(), path.basename(doc.storageKey)));
      if (buffer.length !== doc.size) throw new Error("Un justificatif ne correspond plus au fichier enregistré.");
      attachments.push({ bytes: buffer, mime: doc.mimeType });
    }
    const pdf = await generateReport(reportContent(vehicle, options), attachments);
    return new NextResponse(new Uint8Array(pdf), { headers: { "Content-Type": "application/pdf", "Content-Disposition": `attachment; filename="drivio-${options.template}-${options.from.toISOString().slice(0, 10)}.pdf"`, "Cache-Control": "private, no-store", "X-Content-Type-Options": "nosniff" } });
  } catch (error) { return apiError(error); }
}
