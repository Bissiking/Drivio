// src/lib/reports.ts
import { PDFDocument, StandardFonts, rgb, PDFName } from "pdf-lib";
import { z } from "zod";
import { fuelStats, observedDistance, operatingCosts } from "./analytics";
import { formatCurrency, formatDate, formatNumber } from "./format";
import { LABELS } from "./constants";
import type { vehicleWorkspace } from "./vehicle-workspace";

export const reportSchema = z.object({
  vehicleId: z.string().min(1), template: z.enum(["summary", "maintenance", "sale"]),
  from: z.coerce.date(), to: z.coerce.date(),
  sections: z.array(z.enum(["vehicle", "mileage", "statistics", "costs", "maintenance", "schedules"])).min(1).max(6),
  includeSensitive: z.boolean().default(false), attachmentIds: z.array(z.string().min(1)).max(8).default([]),
}).refine(q => q.from <= q.to, "La fin de période doit suivre le début.")
  .refine(q => q.from.getUTCFullYear() >= 1900 && q.to.getUTCFullYear() <= 2100, "Période non valide.")
  .refine(q => !q.attachmentIds.length || q.includeSensitive, "Les justificatifs originaux nécessitent l'autorisation explicite d'inclure les informations sensibles.");
export type ReportOptions = z.infer<typeof reportSchema>;
type ReportVehicle = NonNullable<Awaited<ReturnType<typeof vehicleWorkspace>>["vehicle"]>;
export type ReportSection = { title: string; columns: string[]; rows: string[][] };
export type ReportContent = { title: string; vehicle: string; period: string; privateMode: boolean; sections: ReportSection[] };

export function reportContent(vehicle: ReportVehicle, options: ReportOptions): ReportContent {
  const until = new Date(options.to); until.setUTCHours(23, 59, 59, 999);
  const cutoff = new Date(Math.min(until.getTime(), Date.now()));
  const inPeriod = (date: Date) => date >= options.from && date <= cutoff;
  const costs = operatingCosts(vehicle.expenses, vehicle.fuelEntries, vehicle.maintenance, vehicle.insurancePolicies, cutoff).filter(c => inPeriod(c.date));
  const fuel = fuelStats(vehicle.fuelEntries.filter(e => inPeriod(e.date)), cutoff);
  const sections: ReportSection[] = [], label = `${vehicle.brand} ${vehicle.model} ${vehicle.trim}`;
  const add = (key: ReportOptions["sections"][number], title: string, columns: string[], rows: string[][]) => { if (options.sections.includes(key)) sections.push({ title, columns, rows }); };
  const last = vehicle.mileageReadings.filter(r => r.date <= cutoff).at(-1);
  add("vehicle", "Véhicule", ["Information", "Valeur"], [["Modèle", label], ["Année", String(vehicle.year)], ["Compteur réel au terme de la période", last ? `${formatNumber(last.mileage, " km")} · ${formatDate(last.date)}` : "Aucun relevé"], ...(options.includeSensitive ? [["Immatriculation", vehicle.registration ?? "Non renseignée"], ["VIN", vehicle.vin ?? "Non renseigné"]] : [["Immatriculation / VIN", "Masqués"]])]);
  add("statistics", "Statistiques de la période", ["Indicateur", "Valeur"], [["Distance observée", formatNumber(observedDistance(vehicle.mileageReadings, inPeriod, cutoff), " km")], ["Consommation fiable", fuel.consumption === null ? "Données insuffisantes" : formatNumber(fuel.consumption, " L/100 km")], ["Carburant enregistré", formatCurrency(fuel.total)], ["Coûts d'usage dédupliqués", formatCurrency(costs.reduce((n, c) => n + Number(c.amount), 0))]]);
  add("mileage", "Relevés kilométriques réels", ["Date", "Compteur", "Provenance"], vehicle.mileageReadings.filter(r => inPeriod(r.date)).map(r => [formatDate(r.date), formatNumber(r.mileage, " km"), r.source === "FUEL" ? "Plein" : "Relevé manuel"]));
  add("costs", "Coûts d'usage de la période", ["Date", "Catégorie", "Montant", "Nature"], costs.map(c => [formatDate(c.date), LABELS[c.category] ?? c.category, formatCurrency(Number(c.amount)), c.origin === "calculated" ? "Assurance calculée" : "Enregistré"]));
  add("maintenance", "Historique d'entretien", ["Date", "Intervention", "Compteur", "Coût"], vehicle.maintenance.filter(r => inPeriod(r.date)).map(r => [formatDate(r.date), options.includeSensitive ? r.title : LABELS[r.type] ?? "Entretien", r.mileage === null ? "Non renseigné" : formatNumber(r.mileage, " km"), r.cost === null ? "Non renseigné" : formatCurrency(Number(r.cost))]));
  add("schedules", "Échéances connues au jour de génération", ["Intervention", "Date", "Compteur", "Source"], vehicle.schedules.filter(s => !s.completedAt && (!s.dueDate || (s.dueDate >= options.from && s.dueDate <= until))).map(s => [options.includeSensitive ? s.title : LABELS[s.type] ?? "Entretien", s.dueDate ? formatDate(s.dueDate) : "Non renseignée", s.dueMileage === null ? "Non renseigné" : formatNumber(s.dueMileage, " km"), s.provenance === "MANUFACTURER" && s.reference ? "Constructeur, référence saisie" : "Échéance personnelle"]));
  if (sections.reduce((n, s) => n + s.rows.length, 0) > 5000) throw new Error("Le rapport dépasse 5 000 lignes. Réduisez la période.");
  return { title: options.template === "summary" ? "Synthèse automobile" : options.template === "maintenance" ? "Dossier d'entretien" : "Historique pour cession", vehicle: label, period: `${formatDate(options.from)} au ${formatDate(options.to)}`, privateMode: !options.includeSensitive, sections };
}

export type ReportAttachment = { bytes: Uint8Array; mime: string };
export async function generateReport(content: ReportContent, attachments: ReportAttachment[] = []) {
  const pdf = await PDFDocument.create(), regular = await pdf.embedFont(StandardFonts.Helvetica), bold = await pdf.embedFont(StandardFonts.HelveticaBold);
  pdf.setTitle(`Drivio · ${content.title}`); pdf.setAuthor("Drivio"); pdf.setCreator("Drivio");
  const ink = rgb(.09, .095, .105), muted = rgb(.35, .34, .33), copper = rgb(.58, .34, .19), line = rgb(.84, .82, .79);
  const safe = (value: string) => Array.from(value.replace(/[\r\n\t]+/g, " ")).map(c => { try { regular.encodeText(c); return c; } catch { return "?"; } }).join("");
  let page = pdf.addPage([595.28, 841.89]), y = 0;
  const drawText = (text: string, x: number, top: number, size = 10, strong = false, color = ink) => page.drawText(safe(text), { x, y: top, size, font: strong ? bold : regular, color });
  const wrap = (text: string, width: number, size = 10) => {
    const lines: string[] = []; let current = "";
    for (const word of safe(text).split(/\s+/)) {
      if (current && regular.widthOfTextAtSize(`${current} ${word}`, size) <= width) { current += ` ${word}`; continue; }
      if (current) { lines.push(current); current = ""; }
      for (const character of word) { if (current && regular.widthOfTextAtSize(current + character, size) > width) { lines.push(current); current = ""; } current += character; }
    }
    if (current) lines.push(current.trimEnd()); return lines.length ? lines : [""];
  };
  const header = () => {
    page.drawRectangle({ x: 0, y: 733, width: 596, height: 109, color: ink });
    drawText("DRIVIO", 42, 800, 12, true, rgb(.91, .71, .54));
    drawText(content.title, 42, 771, 23, true, rgb(.97, .95, .92));
    const vehicleText = safe(content.vehicle); const vehicleLine = vehicleText.length > 80 ? vehicleText.slice(0, 77) + "..." : vehicleText;
    drawText(vehicleLine, 42, 748, 10, false, rgb(.8, .78, .75));
    drawText(`Période : ${content.period}`, 42, 709, 10, false, muted); y = 676;
  };
  const nextPage = () => { page = pdf.addPage([595.28, 841.89]); header(); };
  header();
  for (const section of content.sections) {
    if (y < 170) nextPage();
    drawText(section.title, 42, y, 14, true); y -= 18;
    page.drawLine({ start: { x: 42, y }, end: { x: 553, y }, thickness: 1, color: copper }); y -= 21;
    const count = section.columns.length, widths = count === 2 ? [250, 261] : count === 3 ? [110, 215, 186] : [90, 205, 106, 110];
    const tableHeader = () => { let x = 42; section.columns.forEach((column, i) => { wrap(column, widths[i] - 12, 9).forEach((l, index) => drawText(l, x, y - index * 11, 9, true, muted)); x += widths[i]; }); y -= 30; };
    tableHeader();
    const rows = section.rows.length ? section.rows : [["Aucun enregistrement pour cette période."]];
    for (const row of rows) {
      const cells = row.map((cell, i) => wrap(cell, widths[i] - 12));
      const height = Math.max(...cells.map(c => c.length)) * 14 + 15;
      if (y - height < 65) { nextPage(); drawText(`${section.title} (suite)`, 42, y, 14, true); y -= 30; tableHeader(); }
      let x = 42;
      cells.forEach((cell, i) => { cell.forEach((l, index) => drawText(l, x, y - index * 14)); x += widths[i]; });
      y -= height; page.drawLine({ start: { x: 42, y: y + 7 }, end: { x: 553, y: y + 7 }, thickness: .4, color: line });
    }
    y -= 23;
  }
  if (attachments.length) {
    nextPage(); drawText("Justificatifs originaux", 42, y, 17, true); y -= 32;
    for (const lineText of ["Ces annexes ont été sélectionnées explicitement par le propriétaire.", "Elles peuvent contenir des informations personnelles non masquées.", "Les pages suivantes reproduisent les pièces fournies, sans certifier leur authenticité."]) { wrap(lineText, 510).forEach(l => { drawText(l, 42, y); y -= 17; }); }
    for (const attachment of attachments) {
      if (attachment.mime === "application/pdf") {
        const source = await PDFDocument.load(attachment.bytes);
        if (source.getPageCount() > 100 || pdf.getPageCount() + source.getPageCount() > 300) throw new Error("Trop de pages dans les justificatifs.");
        const copied = await pdf.copyPages(source, source.getPageIndices());
        for (const copiedPage of copied) { copiedPage.node.delete(PDFName.of("Annots")); copiedPage.node.delete(PDFName.of("AA")); pdf.addPage(copiedPage); }
      } else if (["image/jpeg", "image/png"].includes(attachment.mime)) {
        const image = attachment.mime === "image/png" ? await pdf.embedPng(attachment.bytes) : await pdf.embedJpg(attachment.bytes);
        const p = pdf.addPage([595.28, 841.89]), scale = Math.min(511 / image.width, 730 / image.height, 1);
        p.drawImage(image, { x: (595.28 - image.width * scale) / 2, y: (841.89 - image.height * scale) / 2, width: image.width * scale, height: image.height * scale });
      } else throw new Error("Justificatif non pris en charge : utilisez PDF, JPG ou PNG.");
    }
  }
  pdf.getPages().forEach((p, index) => { p.drawText(safe(`${content.privateMode ? "Données sensibles masquées" : "Document privé - informations sensibles incluses"} · Drivio · ${index + 1}/${pdf.getPageCount()}`), { x: 42, y: 29, size: 8, font: regular, color: muted }); });
  return pdf.save();
}
