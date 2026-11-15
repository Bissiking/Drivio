// src/lib/fuel-sync.ts
import { randomUUID } from "node:crypto";
import { db } from "./db";
import { decodeFuelArchive, downloadFuelArchive, type FeedStation } from "./fuel-feed";

const STATE = "fuel-prices-sync", LEASE_MS = 9 * 60_000;
export class FuelSyncBusy extends Error {}
export type ImportStats = { stations: number; created: number; changed: number; unchanged: number; priceChanges: number; declarations: number; outageChanges: number; absent: number; invalidOutages: number; unknownOutageTypes: number; durationMs: number };

export async function claimFuelSync(owner: string, now = new Date()) {
  const claimed = await db.fuelSyncState.updateMany({ where: { id: STATE, OR: [{ leaseUntil: null }, { leaseUntil: { lt: now } }] }, data: { leaseOwner: owner, leaseUntil: new Date(now.getTime() + LEASE_MS), startedAt: now, status: "RUNNING", error: null } });
  if (!claimed.count) throw new FuelSyncBusy("Un import est déjà en cours.");
}

export async function importFuelStations(stations: FeedStation[], hash: string, owner: string, startedAt: Date, minimumStations = 1000): Promise<ImportStats> {
  const now = new Date();
  return db.$transaction(async tx => {
    // Fencing write: no expired owner can publish after a new execution claims the row.
    const fence = await tx.fuelSyncState.updateMany({ where: { id: STATE, leaseOwner: owner, leaseUntil: { gt: now } }, data: { leaseUntil: new Date(now.getTime() + LEASE_MS) } });
    if (!fence.count) throw new Error("Bail d'import expiré.");
    const state = await tx.fuelSyncState.findUniqueOrThrow({ where: { id: STATE } });
    if (stations.length < minimumStations || (state.stationCount > 0 && stations.length < state.stationCount * 0.85)) throw new Error("Flux suspect ou incomplet : import annulé, données conservées.");
    const priorPriceCount = await tx.fuelPrice.count({ where: { active: true, station: { active: true } } });
    const incomingPrices = stations.reduce((n, s) => n + s.prices.length, 0);
    if (priorPriceCount >= 1000 && incomingPrices < priorPriceCount * 0.85) throw new Error("Flux de prix incomplet : import annulé, données conservées.");
    const previous = await tx.fuelStation.findMany({ select: { id: true, fingerprint: true, active: true } });
    const old = new Map(previous.map(s => [s.id, s])), seen = new Set(stations.map(s => s.id));
    const stats: ImportStats = { stations: stations.length, created: 0, changed: 0, unchanged: 0, priceChanges: 0, declarations: 0, outageChanges: 0, absent: 0, invalidOutages: stations.reduce((n, s) => n + s.invalidOutages, 0), unknownOutageTypes: stations.reduce((n, s) => n + s.outages.filter(o => o.type === "UNKNOWN").length, 0), durationMs: 0 };
    for (const station of stations) {
      const before = old.get(station.id);
      if (before?.fingerprint === station.fingerprint && before.active) { stats.unchanged++; continue; }
      const { prices, outages, invalidOutages, ...data } = station;
      if (before) stats.changed++; else stats.created++;
      await tx.fuelStation.upsert({ where: { id: station.id }, create: { ...data, lastSeenAt: now }, update: { ...data, lastSeenAt: now, active: true, missingSince: null } });
      const priorPrices = await tx.fuelPrice.findMany({ where: { stationId: station.id } });
      for (const price of prices) {
        const prior = priorPrices.find(p => p.fuelId === price.fuelId);
        // Reject older snapshots rather than allowing a rollback of official declarations.
        if (prior && price.declaredAt < prior.declaredAt) throw new Error("Le flux contient une déclaration antérieure à celle importée.");
        const changed = !prior || Number(prior.value) !== price.value;
        if (changed) stats.priceChanges++;
        if (changed || !prior || prior.declaredAt.getTime() !== price.declaredAt.getTime()) {
          stats.declarations++;
          await tx.fuelPriceHistory.upsert({ where: { stationId_fuelId_declaredAt_value: { stationId: station.id, fuelId: price.fuelId, declaredAt: price.declaredAt, value: price.value } }, create: { stationId: station.id, ...price, observedAt: now }, update: {} });
        }
        await tx.fuelPrice.upsert({ where: { stationId_fuelId: { stationId: station.id, fuelId: price.fuelId } }, create: { stationId: station.id, ...price }, update: { ...price, active: true } });
      }
      await tx.fuelPrice.updateMany({ where: { stationId: station.id, fuelId: { notIn: prices.map(p => p.fuelId) } }, data: { active: false } });
      const priorOutages = await tx.fuelOutage.findMany({ where: { stationId: station.id, endedAt: null } });
      for (const outage of outages) {
        const prior = priorOutages.find(o => o.fuelId === outage.fuelId && o.startedAt.getTime() === outage.startedAt.getTime());
        if (!prior || prior.type !== outage.type || outage.endedAt) stats.outageChanges++;
        await tx.fuelOutage.upsert({ where: { stationId_fuelId_startedAt: { stationId: station.id, fuelId: outage.fuelId, startedAt: outage.startedAt } }, create: { stationId: station.id, ...outage, endSource: outage.endedAt ? "OFFICIAL" : null }, update: { ...outage, endSource: outage.endedAt ? "OFFICIAL" : null } });
      }
      for (const outage of priorOutages) if (!invalidOutages && !outages.some(o => o.fuelId === outage.fuelId && o.startedAt.getTime() === outage.startedAt.getTime())) { await tx.fuelOutage.update({ where: { id: outage.id }, data: { endedAt: now, endSource: "OBSERVED_ABSENCE" } }); stats.outageChanges++; }
    }
    // No deletion: preserve station IDs and price history for existing fills.
    const absent = previous.filter(s => s.active && !seen.has(s.id)).map(s => s.id); stats.absent = absent.length;
    for (let index = 0; index < absent.length; index += 400) await tx.fuelStation.updateMany({ where: { id: { in: absent.slice(index, index + 400) } }, data: { active: false, missingSince: now } });
    await tx.fuelStation.updateMany({ where: { active: true }, data: { lastSeenAt: now } });
    stats.durationMs = Date.now() - startedAt.getTime();
    await tx.fuelSyncState.update({ where: { id: STATE }, data: { leaseOwner: null, leaseUntil: null, status: "SUCCESS", completedAt: new Date(), snapshotHash: hash, stationCount: stations.length, statsJson: JSON.stringify(stats), error: null } });
    return stats;
  }, { timeout: 480_000, maxWait: 10_000 });
}

export async function syncFuelPrices(download = downloadFuelArchive) {
  const owner = randomUUID(), startedAt = new Date();
  await claimFuelSync(owner, startedAt);
  try {
    const { stations, hash } = decodeFuelArchive(await download(AbortSignal.timeout(60_000)));
    return { executionId: owner, stats: await importFuelStations(stations, hash, owner, startedAt) };
  } catch (error) {
    await db.fuelSyncState.updateMany({ where: { id: STATE, leaseOwner: owner }, data: { leaseOwner: null, leaseUntil: null, status: "FAILED", error: (error instanceof Error ? error.message : "Import interrompu").slice(0, 500) } });
    throw error;
  }
}
