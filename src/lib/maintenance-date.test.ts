import { expect, it } from "vitest";
import { maintenanceState } from "./maintenance-date";
import { maintenanceGauges } from "./maintenance-gauges";
it("affiche une même estimation depuis la dernière observation, même en rouvrant la page plus tard", () => {
  const readings = [{ date: new Date("2026-06-01"), mileage: 30000 }, { date: new Date("2026-11-17"), mileage: 36000 }];
  const schedule = { id: "s", type: "VIDANGE", title: "Vidange", dueDate: null, dueMileage: 37000, warningDays: 30, warningKm: 1500, completedAt: null };
  const vehicle = { id: "v", purchaseMileage: 10000, finalMileage: null, mileageReadings: readings, schedules: [schedule], maintenance: [], tireSets: [] };
  const now = new Date("2026-11-18"), later = new Date("2026-11-19");
  const state = maintenanceState(schedule, 36000, readings, now), gauge = maintenanceGauges(vehicle, now)[0];
  expect(state.estimatedDate).toEqual(gauge.dueDate); expect(maintenanceState(schedule, 36000, readings, later).estimatedDate).toEqual(state.estimatedDate);
  expect(maintenanceState(schedule, 36000, readings.slice(-1), now).estimatedDate).toBeNull();
});
