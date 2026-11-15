// src/lib/predictions.test.ts
import { describe, expect, it } from "vitest";
import { addMonths, budgetForecast, drivingRate, wearPredictions, type PredictionVehicle } from "./predictions";
const now = new Date("2026-10-01T00:00:00Z"), day = 86_400_000;
const vehicle = (patch: Partial<PredictionVehicle> = {}): PredictionVehicle => ({ id: "car", status: "ACTIVE", purchaseDate: new Date("2026-01-01"), mileageReadings: Array.from({ length: 7 }, (_, i) => ({ date: new Date(now.getTime() - (6 - i) * 30 * day), mileage: 10000 + i * 1500 })), expenses: [], fuelEntries: [], maintenance: [], schedules: [], tireSets: [], insurancePolicies: [], ...patch });
describe("prévisions fondées sur les données observées", () => {
  it("calcule le rythme réel sans inclure de compteur futur", () => {
    const car = vehicle(); car.mileageReadings.push({ date: new Date("2027-01-01"), mileage: 999999 });
    expect(drivingRate(car.mileageReadings, now)).toMatchObject({ daily: 50, current: 19000, confidence: "HIGH" });
  });
  it("dégrade la confiance pour un relevé ancien et repart après correction", () => {
    expect(drivingRate([{ date: new Date("2025-01-01"), mileage: 1000 }, { date: new Date("2025-03-01"), mileage: 2000 }], now).confidence).toBe("LOW");
    expect(drivingRate([{ date: new Date("2026-01-01"), mileage: 50000 }, { date: new Date("2026-09-01"), mileage: 1000 }, { date: now, mileage: 1300 }], now).daily).toBe(10);
  });
  it("ne fabrique ni recommandation constructeur ni profondeur physique", () => {
    const car = vehicle({ tireSets: [{ id: "tires", brand: "Test", position: "Avant", mountedMileage: 5000, removedAt: null, measurements: [] }] });
    expect(wearPredictions(car, now)[0]).toMatchObject({ measuredDepth: null, dueMileage: null, dueDate: null, confidence: "LOW" });
  });
  it("projette seulement depuis deux mesures physiques et un seuil choisi", () => {
    const car = vehicle({ tireSets: [{ id: "tires", brand: "Test", position: "Avant", mountedMileage: 5000, removedAt: null, targetDepthMm: 2, measurements: [{ date: new Date("2026-07-01"), mileage: 14000, treadDepthMm: 6 }, { date: new Date("2026-09-01"), mileage: 17000, treadDepthMm: 4 }] }] });
    expect(wearPredictions(car, now)[0]).toMatchObject({ measuredDepth: 4, dueMileage: 20000, confidence: "LOW" });
    car.tireSets[0].measurements[1].treadDepthMm = 7;
    expect(wearPredictions(car, now)[0].dueMileage).toBeNull();
  });
  it("date une échéance kilométrique depuis le dernier relevé, pas depuis aujourd'hui", () => {
    const car = vehicle({ schedules: [{ id: "s", type: "VIDANGE", title: "Vidange", dueDate: new Date("2027-01-01"), dueMileage: 19500, warningDays: 30, warningKm: 1500, completedAt: null }] });
    expect(wearPredictions(car, now)[0].dueDate?.toISOString()).toBe("2026-10-11T00:00:00.000Z");
    expect(wearPredictions(car, now)[0].origin).toBe("USER");
  });
  it("ne double pas les coûts de plein ni les charges futures déjà enregistrées", () => {
    const car = vehicle({ expenses: [{ id: "paid", vehicleId: "car", category: "CARBURANT", amount: 100, date: new Date("2026-09-15"), mileage: 18000, fuelEntryId: "f" }, { id: "future", vehicleId: "car", category: "CARBURANT", amount: 100, date: new Date("2026-10-15") }], fuelEntries: [{ id: "f", vehicleId: "car", date: new Date("2026-09-15"), mileage: 18000, liters: 50, totalPrice: 100, isFull: true }] });
    const forecast = budgetForecast(car, 3, false, now);
    expect(forecast.items.filter(i => i.certainty === "CERTAIN").reduce((n, i) => n + i.amount, 0)).toBe(100);
    expect(forecast.items.filter(i => i.key === "CARBURANT-0")).toHaveLength(0);
    expect(forecast.total).toBeLessThan(160);
  });
  it("prend les contrats connus sans supposer leur renouvellement et différencie les scénarios", () => {
    const car = vehicle({ insurancePolicies: [{ id: "p", vehicleId: "car", startDate: new Date("2026-01-15"), renewalDate: new Date("2026-12-01"), cost: 50, frequency: "MONTHLY", includeInCosts: true }], maintenance: [{ id: "m1", vehicleId: "car", type: "VIDANGE", title: "Vidange", date: new Date("2026-01-01"), mileage: 10000, cost: 100 }, { id: "m2", vehicleId: "car", type: "VIDANGE", title: "Vidange", date: new Date("2026-07-01"), mileage: 19000, cost: 100 }] });
    const normal = budgetForecast(car, 6, false, now), prudent = budgetForecast(car, 6, true, now);
    expect(normal.items.filter(i => i.category === "ASSURANCE")).toHaveLength(2);
    expect(prudent.total).toBeGreaterThan(normal.total);
    expect(normal.unknown.join()).toContain("renouvellement");
  });
  it("gère les fins de mois et n'estime rien pour un véhicule archivé", () => {
    expect(addMonths(new Date("2026-01-31"), 1).toISOString()).toBe("2026-02-28T00:00:00.000Z");
    expect(budgetForecast(vehicle({ status: "ARCHIVED" }), 12, true, now).total).toBe(0);
  });
  it("ne refacture pas une échéance couverte par une intervention déjà enregistrée", () => {
    const car = vehicle({ schedules: [{ id: "s", type: "VIDANGE", title: "Vidange", dueDate: new Date("2026-09-01"), dueMileage: 18000, estimatedCost: 200, warningDays: 30, warningKm: 1500, completedAt: null }], maintenance: [{ id: "done", vehicleId: "car", type: "VIDANGE", title: "Vidange", date: new Date("2026-09-15"), mileage: 18500, cost: 200 }] });
    expect(budgetForecast(car, 3, true, now).items.filter(i => i.key === "schedule-s")).toHaveLength(0);
    expect(budgetForecast(car, 3, true, now).unknown.join()).toContain("clôture");
  });
  it("n'utilise chaque dépense future qu'une fois pour dédupliquer les interventions prévues", () => {
    const schedules = ["s1", "s2"].map(id => ({ id, type: "VIDANGE", title: id, dueDate: new Date("2026-10-15"), dueMileage: null, estimatedCost: 200, warningDays: 30, warningKm: 1500, completedAt: null }));
    const car = vehicle({ schedules, expenses: [{ id: "future", vehicleId: "car", date: new Date("2026-10-15"), category: "ENTRETIEN", amount: 200 }] });
    expect(budgetForecast(car, 3, true, now).items).toHaveLength(2);
  });
});
