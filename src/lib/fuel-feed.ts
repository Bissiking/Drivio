// src/lib/fuel-feed.ts
import { createHash } from "node:crypto";
import { unzipSync } from "fflate";
import { XMLParser, XMLValidator } from "fast-xml-parser";

export const FUEL_SOURCE = "https://donnees.roulez-eco.fr/opendata/instantane_ruptures";
import { FUELS } from "./fuel-types";
export const digest = (value: string | Uint8Array) => createHash("sha256").update(value).digest("hex");
export type FeedStation = { id: string; address: string; city: string; postalCode: string; searchText: string; latitude: number | null; longitude: number | null; fingerprint: string; invalidOutages: number; availabilityUncertain: boolean; prices: { fuelId: string; value: number; declaredAt: Date }[]; outages: { fuelId: string; startedAt: Date; endedAt: Date | null; type: string }[] };
export const normalizeArea = (value: string) => value.normalize("NFD").replace(/[\u0300-\u036f]/g, "").toLowerCase().trim();
const parisFormat = new Intl.DateTimeFormat("sv-SE", { timeZone: "Europe/Paris", year: "numeric", month: "2-digit", day: "2-digit", hour: "2-digit", minute: "2-digit", second: "2-digit", hourCycle: "h23" });

// Official timestamps are French wall time, without a UTC offset.
export function parseFrenchDate(value: string) {
  if (!/^\d{4}-\d\d-\d\d[ T]\d\d:\d\d:\d\d$/.test(value)) throw new Error("Date officielle invalide.");
  const normalized = value.replace("T", " "), utc = Date.parse(normalized.replace(" ", "T") + "Z");
  for (const offset of [2, 1]) { const date = new Date(utc - offset * 3_600_000); if (Number.isFinite(date.getTime()) && parisFormat.format(date) === normalized) return date; }
  throw new Error("Date officielle hors calendrier.");
}

type XmlNode = Record<string, unknown>;
function node(value: unknown): XmlNode { if (!value || typeof value !== "object") throw new Error("Nœud XML invalide."); return value as XmlNode; }
function list(value: unknown): unknown[] { return value == null ? [] : Array.isArray(value) ? value : [value]; }
function textValue(value: unknown, max = 500) { const result = String(value ?? "").trim(); if (result.length > max) throw new Error("Champ officiel trop long."); return result; }
function fuelId(value: unknown) { const id = String(value); if (!FUELS[id]) throw new Error("Carburant officiel inconnu."); return id; }

export function parseFuelXml(xml: string, now = new Date()): FeedStation[] {
  if (xml.length > 60_000_000 || /<!DOCTYPE|<!ENTITY/i.test(xml)) throw new Error("XML non autorisé.");
  if (XMLValidator.validate(xml) !== true) throw new Error("Flux XML incomplet ou mal formé.");
  const root = new XMLParser({ ignoreAttributes: false, attributeNamePrefix: "", parseTagValue: false, parseAttributeValue: false, trimValues: true }).parse(xml);
  const stations = list(root?.pdv_liste?.pdv);
  if (!stations.length) throw new Error("Le flux ne contient aucune station.");
  const ids = new Set<string>();
  return stations.map(raw => {
    const s = node(raw), id = textValue(s.id, 20);
    if (!/^\d+$/.test(id) || ids.has(id)) throw new Error("Identifiant station invalide ou dupliqué."); ids.add(id);
    const coordinate = (value: unknown, max: number) => { if (value == null || value === "") return null; const n = Number(value) / 100000; if (!Number.isFinite(n) || Math.abs(n) > max) throw new Error("Coordonnées station invalides."); return n === 0 ? null : n; };
    const prices = list(s.prix).map(raw => { const p = node(raw), value = Number(p.valeur), declaredAt = parseFrenchDate(String(p.maj)); if (!Number.isFinite(value) || value <= 0 || value > 20 || declaredAt.getTime() > now.getTime() + 2 * 3_600_000) throw new Error("Prix officiel invalide."); return { fuelId: fuelId(p.id), value, declaredAt }; });
    if (new Set(prices.map(p => p.fuelId)).size !== prices.length) throw new Error("Prix carburant dupliqué.");
    let invalidOutages = 0;
    const outages = list(s.rupture).flatMap(raw => {
      const p = node(raw), id = fuelId(p.id), type = textValue(p.type) || "UNKNOWN";
      if (!["temporaire", "definitive", "UNKNOWN"].includes(type)) throw new Error("Type de rupture inconnu.");
      try {
        const startedAt = parseFrenchDate(String(p.debut)), endedAt = p.fin ? parseFrenchDate(String(p.fin)) : null;
        if (startedAt.getUTCFullYear() < 2000 || (endedAt && endedAt < startedAt) || startedAt.getTime() > now.getTime() + 2 * 3_600_000) throw new Error("Date de rupture invalide.");
        return [{ fuelId: id, startedAt, endedAt, type }];
      } catch { invalidOutages++; return []; }
    });
    if (new Set(outages.map(p => `${p.fuelId}-${p.startedAt.toISOString()}`)).size !== outages.length) throw new Error("Rupture dupliquée.");
    const data = { id, address: textValue(s.adresse), city: textValue(s.ville), postalCode: textValue(s.cp, 10), latitude: coordinate(s.latitude, 90), longitude: coordinate(s.longitude, 180), prices: prices.toSorted((a, b) => a.fuelId.localeCompare(b.fuelId)), outages: outages.toSorted((a, b) => `${a.fuelId}-${a.startedAt.toISOString()}`.localeCompare(`${b.fuelId}-${b.startedAt.toISOString()}`)) };
    if (!/^\d{5}$/.test(data.postalCode)) throw new Error("Code postal officiel invalide.");
    return { ...data, invalidOutages, availabilityUncertain: invalidOutages > 0, searchText: normalizeArea(`${data.city} ${data.postalCode} ${data.address}`), fingerprint: digest(JSON.stringify({ ...data, rawOutages: s.rupture })) };
  });
}

export function decodeFuelArchive(buffer: Uint8Array, now = new Date()) {
  if (buffer.length > 10_000_000) throw new Error("Archive officielle trop volumineuse.");
  let accepted = 0;
  const files = unzipSync(buffer, { filter: f => { if (!f.name.endsWith(".xml")) return false; if (f.originalSize > 60_000_000 || ++accepted > 1) throw new Error("Archive officielle invalide."); return true; } });
  const values = Object.values(files);
  if (values.length !== 1) throw new Error("Une seule source XML est attendue.");
  const header = new TextDecoder().decode(values[0].subarray(0, 160));
  const xml = new TextDecoder(/ISO-8859-1/i.test(header) ? "iso-8859-1" : "utf-8", { fatal: true }).decode(values[0]);
  return { stations: parseFuelXml(xml, now), hash: digest(buffer) };
}

export async function downloadFuelArchive(signal?: AbortSignal) {
  const response = await fetch(FUEL_SOURCE, { cache: "no-store", redirect: "error", signal: signal ?? AbortSignal.timeout(60_000) });
  if (!response.ok || !response.body) throw new Error(`Source officielle indisponible (${response.status}).`);
  const reader = response.body.getReader(), chunks: Uint8Array[] = []; let size = 0;
  try { while (true) { const { done, value } = await reader.read(); if (done) break; size += value.byteLength; if (size > 10_000_000) throw new Error("Archive officielle trop volumineuse."); chunks.push(value); } }
  finally { await reader.cancel(); }
  const bytes = new Uint8Array(size); let offset = 0; for (const chunk of chunks) { bytes.set(chunk, offset); offset += chunk.length; }
  return bytes;
}

export function distanceKm(lat: number, lon: number, otherLat: number, otherLon: number) {
  const rad = Math.PI / 180, a = Math.sin((otherLat - lat) * rad / 2) ** 2 + Math.cos(lat * rad) * Math.cos(otherLat * rad) * Math.sin((otherLon - lon) * rad / 2) ** 2;
  return 6371 * 2 * Math.atan2(Math.sqrt(Math.min(1, a)), Math.sqrt(Math.max(0, 1 - a)));
}
