import { calculateScheduleState, type ReadingPoint, type ScheduleInput } from "./calculations";
import { drivingRate } from "./predictions";

// Anchor projections to the last observation, not the day a page is opened.
// Dashboard, maintenance list and gauges must describe the same estimate.
export function projectMileageDate(dueMileage: number | null, currentMileage: number, rate: { daily: number | null; lastDate: Date | null }) {
  return dueMileage !== null && rate.daily && rate.lastDate
    ? new Date(rate.lastDate.getTime() + (dueMileage - currentMileage) / rate.daily * 86400000)
    : null;
}
export function maintenanceState(schedule: ScheduleInput, currentMileage: number, readings: ReadingPoint[], now = new Date()) {
  return { ...calculateScheduleState(schedule, currentMileage, 0, now), estimatedDate: projectMileageDate(schedule.dueMileage, currentMileage, drivingRate(readings, now)) };
}
