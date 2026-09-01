// src/lib/calculations.test.ts
import { describe, expect, it } from "vitest";
import { calculateFuelMetrics, calculateMileageStats, calculateScheduleState } from "./calculations";

describe("calculs Drivio", () => {
  it("calcule les distances et projections kilometriques", () => {
    const stats = calculateMileageStats(
      [
        { mileage: 30_000, date: new Date("2026-01-01") },
        { mileage: 31_000, date: new Date("2026-01-11") },
      ],
      new Date("2026-01-11"),
    );
    expect(stats.total).toBe(1_000);
    expect(stats.averageDaily).toBe(100);
    expect(stats.annualProjection).toBe(36_500);
  });

  it("ne calcule le carburant que lorsqu'une distance est connue", () => {
    expect(calculateFuelMetrics(50, 90, null).consumption).toBeNull();
    expect(calculateFuelMetrics(50, 90, 700).consumption).toBeCloseTo(7.14, 2);
  });

  it("priorise un retard kilometrique", () => {
    const state = calculateScheduleState(
      { dueDate: null, dueMileage: 34_000, warningDays: 30, warningKm: 1_500 },
      35_000,
      40,
      new Date("2026-08-31"),
    );
    expect(state.status).toBe("OVERDUE");
    expect(state.kmRemaining).toBe(-1_000);
  });
});
