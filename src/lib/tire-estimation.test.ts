import { describe, expect, it } from "vitest";
import { activeTireAxles, estimateTireLife, tireLifeAssumption } from "./tire-estimation";
import { maintenanceGauges, type GaugeVehicle } from "./maintenance-gauges";
import { wearPredictions, budgetForecast, type PredictionVehicle } from "./predictions";
const now = new Date("2026-11-15T00:00:00Z");
const tire = { id: "all", brand: "Test", type: "ETE", quality: "STANDARD", position: "COMPLET", mountedAt: new Date("2026-01-01"), mountedMileage: 10000, removedAt: null, estimatedLifeKm: null, replacementCost: 400 };
const car = { id: "car", drivetrain: "FRONT", status: "ACTIVE", purchaseDate: new Date("2025-01-01"), purchaseMileage: 10000, finalMileage: null, mileageReadings: [{ date: new Date("2026-10-15"), mileage: 47000 }, { date: now, mileage: 48000 }], maintenance: [], schedules: [], tireSets: [tire], fuelEntries: [], expenses: [], insurancePolicies: [] } satisfies GaugeVehicle & PredictionVehicle;

describe("suivi des pneus par essieu", () => {
  it("distingue traction, propulsion, intégrale et transmission inconnue", () => {
    const front = { ...tire, position: "AVANT" }, rear = { ...tire, position: "ARRIERE" };
    expect(tireLifeAssumption(front, "FRONT").lifeKm).toBeLessThan(tireLifeAssumption(rear, "FRONT").lifeKm);
    expect(tireLifeAssumption(rear, "REAR").lifeKm).toBeLessThan(tireLifeAssumption(front, "REAR").lifeKm);
    expect(tireLifeAssumption(front, "AWD").lifeKm).toBe(tireLifeAssumption(rear, "AWD").lifeKm);
    expect(tireLifeAssumption(front).lifeKm).toBe(tireLifeAssumption(rear).lifeKm);
  });
  it("distingue la saison et la gamme sans déduire une qualité de la marque", () => {
    expect(tireLifeAssumption({ ...tire, quality: "PREMIUM" }).lifeKm).toBeGreaterThan(tireLifeAssumption(tire).lifeKm);
    expect(tireLifeAssumption({ ...tire, quality: "BUDGET" }).lifeKm).toBeLessThan(tireLifeAssumption(tire).lifeKm);
    expect(tireLifeAssumption({ ...tire, type: "HIVER" }).lifeKm).toBeLessThan(tireLifeAssumption(tire).lifeKm);
    expect(tireLifeAssumption({ ...tire, type: "QUATRE_SAISONS" }).lifeKm).toBeLessThan(tireLifeAssumption(tire).lifeKm);
    expect(tireLifeAssumption({ quality: "UNKNOWN" }).lifeKm).toBe(40000);
  });
  it("conserve la priorité de la longévité manuelle sans la corriger deux fois", () => {
    expect(estimateTireLife({ ...tire, position: "AVANT", quality: "BUDGET", type: "HIVER", estimatedLifeKm: 50000 }, 35000, now, "FRONT")).toMatchObject({ lifeKm: 50000, percent: 50, manual: true });
    expect(estimateTireLife(tire, 9000, now).percent).toBeNull();
    expect(estimateTireLife({ ...tire, mountedAt: new Date("2027-01-01") }, 35000, now).percent).toBeNull();
  });
  it("garde au plus un montage par essieu pour les anciens doublons", () => {
    const newer = { ...tire, id: "front", position: "AVANT", mountedAt: new Date("2026-06-01") };
    const axles = activeTireAxles([tire, newer, { ...tire, id: "removed", removedAt: now }]);
    expect(axles).toHaveLength(2);
    expect(axles.find(t => t.position === "AVANT")?.sourceId).toBe("front");
    expect(axles.find(t => t.position === "ARRIERE")?.sourceId).toBe("all");
  });
  it("utilise les mêmes seuils par essieu dans le dashboard et les prévisions", () => {
    const gauges = maintenanceGauges(car, now), predictions = wearPredictions(car, now);
    expect(gauges).toHaveLength(2); expect(predictions).toHaveLength(2);
    for (const gauge of gauges) {
      const prediction = predictions.find(p => p.id === gauge.id)!;
      expect(prediction.dueMileage).toBe(gauge.referenceMileage! + gauge.estimatedLifeKm!);
      expect(prediction.dueDate).toEqual(gauge.dueDate);
    }
    expect(gauges.find(g => g.title.includes("avant"))!.percent).toBe(0);
    expect(gauges.find(g => g.title.includes("arrière"))!.percent).toBeGreaterThan(0);
  });
  it("répartit un coût des quatre pneus et ne déduit pas un prix par essieu de dépenses ambiguës", () => {
    const predictions = wearPredictions(car, now);
    expect(predictions.map(p => p.amount)).toEqual([200, 200]);
    expect(budgetForecast(car, 3, true, now).items.filter(i => i.category === "PNEUS").reduce((n, i) => n + i.amount, 0)).toBeCloseTo(460, 2);
    expect(wearPredictions({ ...car, tireSets: [{ ...tire, replacementCost: null }] }, now).every(p => p.amount === null)).toBe(true);
  });
});
