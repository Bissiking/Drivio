// src/lib/fuel-feed.test.ts
import { describe, expect, it } from "vitest";
import { zipSync, strToU8 } from "fflate";
import { decodeFuelArchive, distanceKm, parseFrenchDate, parseFuelXml } from "./fuel-feed";
const xml = `<?xml version="1.0" encoding="ISO-8859-1"?><pdv_liste><pdv id="75001001" latitude="4885660" longitude="235220" cp="75001"><adresse>Rue du marché</adresse><ville>Paris</ville><prix id="1" nom="Gazole" valeur="1.759" maj="2026-10-01 10:00:00"/><rupture id="5" nom="E10" debut="2026-10-01 09:00:00" fin="" type="temporaire"/></pdv></pdv_liste>`;
describe("flux officiel enrichi", () => {
  it("conserve identifiants, décimales, coordonnées et dates de déclaration", () => {
    const [station] = parseFuelXml(xml);
    expect(station).toMatchObject({ id: "75001001", latitude: 48.8566, longitude: 2.3522, searchText: "paris 75001 rue du marche" });
    expect(station.prices[0]).toMatchObject({ value: 1.759, declaredAt: new Date("2026-10-01T08:00:00Z") });
    expect(station.outages[0]).toMatchObject({ endedAt: null, type: "temporaire" });
  });
  it("décode le ZIP ISO-8859-1 sans corrompre les accents", () => {
    const bytes = Uint8Array.from(xml, c => c.charCodeAt(0));
    expect(decodeFuelArchive(zipSync({ "feed.xml": bytes })).stations[0].address).toBe("Rue du marché");
  });
  it("gère l'heure française d'hiver et d'été, refuse les dates impossibles", () => {
    expect(parseFrenchDate("2026-01-01 10:00:00").toISOString()).toBe("2026-01-01T09:00:00.000Z");
    expect(parseFrenchDate("2026-07-01 10:00:00").toISOString()).toBe("2026-07-01T08:00:00.000Z");
    expect(() => parseFrenchDate("2026-02-30 10:00:00")).toThrow();
  });
  it("refuse XML incomplet, entités, prix invalides et carburants dupliqués", () => {
    expect(() => parseFuelXml(xml.slice(0, -10))).toThrow();
    expect(() => parseFuelXml(`<!DOCTYPE x>${xml}`)).toThrow();
    expect(() => parseFuelXml(xml.replace('valeur="1.759"', 'valeur="-1"'))).toThrow();
    expect(() => parseFuelXml(xml.replace('</pdv>', '<prix id="1" valeur="1.8" maj="2026-10-01 11:00:00"/></pdv>'))).toThrow();
    expect(() => decodeFuelArchive(zipSync({ "a.xml": strToU8(xml), "b.xml": strToU8(xml) }))).toThrow();
  });
  it("calcule une distance géographique cohérente", () => { expect(distanceKm(48.8566, 2.3522, 48.8566, 2.3522)).toBe(0); expect(distanceKm(48.8566, 2.3522, 45.764, 4.8357)).toBeCloseTo(391.5, 0); });
  it("signale les dates de rupture invalides sans les inventer ni garantir la disponibilité", () => {
    const [station] = parseFuelXml(xml.replace('debut="2026-10-01 09:00:00"', 'debut="0216-03-02 00:00:00"').replace('type="temporaire"', 'type=""'));
    expect(station.invalidOutages).toBe(1); expect(station.availabilityUncertain).toBe(true); expect(station.outages).toEqual([]);
    expect(parseFuelXml(xml.replace('type="temporaire"', 'type=""'))[0].outages[0].type).toBe("UNKNOWN");
  });
});
