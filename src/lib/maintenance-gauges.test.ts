// src/lib/maintenance-gauges.test.ts
import { describe, expect, it } from "vitest";
import { maintenanceGauges, type GaugeVehicle } from "./maintenance-gauges";
const now = new Date("2026-11-15T00:00:00Z");
const schedule = { id: "oil", type: "VIDANGE", title: "Vidange + filtre à huile", dueDate: null, dueMileage: 60000, warningDays: 30, warningKm: 1500, completedAt: null };
const vehicle = (patch: Partial<GaugeVehicle> = {}): GaugeVehicle => ({ id: "car", purchaseMileage: 30000, finalMileage: null, mileageReadings: [{ date: new Date("2026-10-15"), mileage: 44000 }, { date: now, mileage: 45000 }], maintenance: [], schedules: [schedule], tireSets: [], ...patch });
describe("jauges de marge avant entretien et de gomme mesurée", () => {
  it("ne déduit pas un pourcentage des seuls kilomètres restants", () => {
    expect(maintenanceGauges(vehicle(), now)[0]).toMatchObject({ percent: null, status: "UNKNOWN", kmRemaining: 15000 });
  });
  it("part de 100 % au dernier entretien compatible et arrive à 0 % au seuil", () => {
    const car = vehicle({ maintenance: [{ id: "record", type: "VIDANGE", title: "Vidange moteur", date: new Date("2025-11-15"), mileage: 30000 }] });
    expect(maintenanceGauges(car, now)[0]).toMatchObject({ percent: 50, referenceMileage: 30000, referenceSource: "RECORD", limitingFactor: "KM" });
    car.mileageReadings = [{ date: now, mileage: 30000 }]; expect(maintenanceGauges(car, now)[0].percent).toBe(100);
    car.mileageReadings = [{ date: now, mileage: 60000 }]; expect(maintenanceGauges(car, now)[0]).toMatchObject({ percent: 0, status: "OVERDUE" });
    car.mileageReadings = [{ date: now, mileage: 65000 }]; expect(maintenanceGauges(car, now)[0].percent).toBe(0);
  });
  it("retient le plus faible des intervalles date et kilomètres documentés", () => {
    const start = new Date("2026-11-01"), due = new Date("2026-11-29");
    const car = vehicle({ schedules: [{ ...schedule, dueDate: due, cycleStartDate: start, cycleStartMileage: 40000 }] });
    const gauge = maintenanceGauges(car, now)[0];
    expect(gauge.percent).toBe(50); expect(gauge.limitingFactor).toBe("DATE"); expect(gauge.referenceSource).toBe("MANUAL");
  });
  it("gère les échéances uniquement calendaires et le zéro sans référence", () => {
    const car = vehicle({ schedules: [{ ...schedule, dueMileage: null, dueDate: new Date("2026-11-29"), cycleStartDate: new Date("2026-11-01") }] });
    expect(maintenanceGauges(car, now)[0]).toMatchObject({ percent: 50, kmRemaining: null });
    car.schedules = [{ ...schedule, dueMileage: null, dueDate: new Date("2026-11-01") }];
    expect(maintenanceGauges(car, now)[0]).toMatchObject({ percent: 0, status: "OVERDUE" });
  });
  it("priorise la référence manuelle sans mélanger deux dates de départ", () => {
    const car = vehicle({ schedules: [{ ...schedule, cycleStartMileage: 40000 }], maintenance: [{ id: "r", type: "VIDANGE", title: schedule.title, date: new Date("2025-11-15"), mileage: 30000 }] });
    expect(maintenanceGauges(car, now)[0]).toMatchObject({ percent: 75, referenceDate: null, referenceMileage: 40000 });
  });
  it("ne mélange pas les filtres distincts ni les tâches personnalisées", () => {
    const car = vehicle({ schedules: [{ ...schedule, id: "cabin", type: "FILTRES", title: "Filtre habitacle" }, { ...schedule, id: "oil-filter", type: "FILTRES", title: "Filtre à huile" }, { ...schedule, id: "dsg", type: "PERSONNALISE", title: "Contrôle DSG7 DQ200" }], maintenance: [{ id: "r", type: "FILTRES", title: "Filtre à huile", date: new Date("2026-01-01"), mileage: 30000 }, { id: "other", type: "PERSONNALISE", title: "Autre contrôle", date: new Date("2026-01-01"), mileage: 30000 }] });
    const gauges = maintenanceGauges(car, now);
    expect(gauges.find(g => g.id === "schedule-cabin")?.percent).toBeNull();
    expect(gauges.find(g => g.id === "schedule-oil-filter")?.percent).toBe(50);
    expect(gauges.find(g => g.id === "schedule-dsg")?.percent).toBeNull();
  });
  it("exclut les entretiens et mesures futurs ainsi que les échéances réalisées", () => {
    const car = vehicle({ schedules: [{ ...schedule, completedAt: new Date("2026-11-01") }], maintenance: [{ id: "future", type: "VIDANGE", title: schedule.title, date: new Date("2027-01-01"), mileage: 45000 }] });
    expect(maintenanceGauges(car, now)).toEqual([]);
    car.schedules = [schedule]; expect(maintenanceGauges(car, now)[0].percent).toBeNull();
  });
  it("calcule la marge de gomme relativement à une mesure, jamais à un pneu neuf supposé", () => {
    const car = vehicle({ schedules: [], tireSets: [{ id: "tires", brand: "Test", position: "AVANT", removedAt: null, targetDepthMm: 2, measurements: [{ date: new Date("2026-01-01"), mileage: 30000, treadDepthMm: 6 }, { date: now, mileage: 45000, treadDepthMm: 4 }] }] });
    const gauge = maintenanceGauges(car, now)[0];
    expect(gauge).toMatchObject({ percent: 50, kind: "TIRE", measuredDepth: 4, referenceDepth: 6, targetDepth: 2 });
    expect(gauge.explanation).toContain("pas un pneu neuf");
    car.tireSets[0].measurements[1].treadDepthMm = 0;
    expect(maintenanceGauges(car, now)[0]).toMatchObject({ percent: 0, status: "OVERDUE" });
  });
  it("laisse une jauge inconnue sans mesures, sans seuil ou avec une série incohérente", () => {
    const tire = { id: "tires", brand: "Test", position: "COMPLET", removedAt: null, measurements: [] };
    expect(maintenanceGauges(vehicle({ schedules: [], tireSets: [tire] }), now)[0].percent).toBeNull();
    const car = vehicle({ schedules: [], tireSets: [{ ...tire, targetDepthMm: 2, measurements: [{ date: new Date("2026-01-01"), mileage: 30000, treadDepthMm: 4 }, { date: now, mileage: 45000, treadDepthMm: 6 }] }] });
    expect(maintenanceGauges(car, now)[0].percent).toBeNull();
    car.tireSets[0].removedAt = now; expect(maintenanceGauges(car, now)).toEqual([]);
  });
});
