import { describe, expect, it } from "vitest";
import { annualStats, fuelStats, fuelIntervals, insuranceCharges, monthKey, operatingCosts, ownershipStats, percentChange, tireDistance, warrantyState } from "./analytics";
const date = (value: string) => new Date(value);
const fuel = (mileage: number, liters: number, isFull: boolean, day: string, vehicleId = "car") => ({ vehicleId, mileage, liters, isFull, date: date(day), totalPrice: liters * 2 });
describe("statistiques carburant fiables", () => {
  it("cumule les appoints et pondère la consommation par les kilomètres", () => {
    const entries = [fuel(1000, 30, true, "2026-01-01"), fuel(1100, 10, false, "2026-01-03"), fuel(1500, 20, true, "2026-01-10"), fuel(1600, 10, true, "2026-01-15")];
    const stats = fuelStats(entries, date("2026-01-20"));
    expect(stats.consumption).toBeCloseTo(40 / 600 * 100);
    expect(stats.costPer100).toBeCloseTo(80 / 600 * 100);
    expect(stats.averageDistance).toBe(200);
    expect(stats.minimumDistance).toBe(100); expect(stats.maximumDistance).toBe(400);
    expect(stats.unitPrice).toBe(2);
  });
  it("ne mélange pas les compteurs de deux véhicules", () => {
    const entries = [fuel(1000, 20, true, "2026-01-01"), fuel(10000, 40, true, "2026-01-02", "other"), fuel(1200, 12, true, "2026-01-04")];
    expect(fuelStats(entries, date("2026-01-20")).averageDistance).toBe(200);
  });
  it("exclut toute période dont le compteur baisse, même si le dernier dépasse l’ancre", () => {
    const intervals = fuelIntervals([fuel(1000, 20, true, "2026-01-01"), fuel(1100, 10, false, "2026-01-03"), fuel(1050, 5, false, "2026-01-04"), fuel(1200, 10, true, "2026-01-10")]);
    expect(intervals.at(-1)?.consumption).toBeNull();
  });
  it("ne calcule pas de consommation sans deux pleins complets", () => {
    expect(fuelStats([fuel(1000, 20, false, "2026-01-01"), fuel(1200, 10, true, "2026-01-10")], date("2026-01-20")).consumption).toBeNull();
  });
  it("compare décembre et janvier sans inventer un pourcentage sur zéro", () => {
    const stats = fuelStats([fuel(1000, 20, true, "2025-12-20"), fuel(1200, 30, true, "2026-01-10")], date("2026-01-20"));
    expect(stats.previous).toBe(40); expect(stats.month).toBe(60); expect(stats.change).toBe(50);
    expect(percentChange(10, 0)).toBeNull();
  });
  it("exclut les pleins futurs et conserve une absence distincte de zéro", () => {
    expect(fuelStats([fuel(1000, 20, true, "2027-01-01")], date("2026-01-20")).total).toBe(0);
    expect(fuelStats([]).averageDistance).toBeNull();
  });
});
describe("contrats, coûts et calendrier", () => {
  const policy = { id: "policy", vehicleId: "car", startDate: date("2026-01-31"), renewalDate: date("2026-05-31"), cost: 50, frequency: "MONTHLY", includeInCosts: true };
  it("borne les mensualités au renouvellement et aux jours réels du calendrier", () => {
    const charges = insuranceCharges([policy], [], date("2026-06-01"));
    expect(charges.map(c => c.date.toISOString().slice(0,10))).toEqual(["2026-01-31", "2026-02-28", "2026-03-31", "2026-04-30"]);
  });
  it("remplace la charge automatique par une assurance saisie dans le même mois", () => {
    const manual = { vehicleId: "car", date: date("2026-02-05"), category: "ASSURANCE", amount: 42 };
    expect(insuranceCharges([policy], [manual], date("2026-03-01")).length).toBe(1);
  });
  it("arrête les échéances à la vente et laisse les contrats désactivés hors coûts", () => {
    expect(insuranceCharges([policy], [], date("2026-06-01"), date("2026-02-01")).length).toBe(1);
    expect(insuranceCharges([{ ...policy, includeInCosts: false }], [], date("2026-06-01"))).toEqual([]);
  });
  it("comptabilise un seul paiement annuel jusqu’au renouvellement", () => {
    expect(insuranceCharges([{ ...policy, frequency: "ANNUAL", renewalDate: date("2027-01-31") }], [], date("2026-12-31")).length).toBe(1);
  });
  it("évite de recompter les dépenses miroir de l’ancienne version", () => {
    const entry = fuel(1000, 20, true, "2026-01-01");
    const maintenance = { id: "record", vehicleId: "car", date: date("2026-01-02"), mileage: 1050, cost: 100 };
    const expenses = [{ vehicleId: "car", date: entry.date, mileage: 1000, category: "CARBURANT", amount: 40 }, { vehicleId: "car", date: maintenance.date, mileage: 1050, category: "ENTRETIEN", amount: 100 }];
    expect(operatingCosts(expenses, [entry], [maintenance], [], date("2026-01-20")).reduce((s, c) => s + Number(c.amount), 0)).toBe(140);
    expect(operatingCosts([], [entry], [maintenance], [], date("2026-01-20")).length).toBe(2);
  });
  it("inclut achat et revente, signale les données absentes et ne divise pas par zéro", () => {
    const vehicle = { purchasePrice: 10000, salePrice: 8000, purchaseDate: date("2026-01-01"), saleDate: date("2026-02-01"), purchaseMileage: 1000, finalMileage: 2000 };
    const costs = [{ vehicleId: "car", date: date("2026-01-20"), category: "CARBURANT", amount: 100 }];
    expect(ownershipStats(vehicle, 9999, costs, date("2026-06-01")).total).toBe(2100);
    expect(ownershipStats(vehicle, 9999, costs).costPerKm).toBe(2.1);
    const missing = ownershipStats({ ...vehicle, purchasePrice: null, finalMileage: 1000 }, 1000, []);
    expect(missing.incomplete).toBe(true); expect(missing.costPerKm).toBeNull();
  });
  it("termine une garantie au premier seuil atteint", () => {
    const warranty = { startDate: date("2025-01-01"), endDate: date("2027-01-01"), maxMileage: 50000 };
    expect(warrantyState(warranty, 50000, date("2026-01-01")).status).toBe("EXPIRED");
    expect(warrantyState(warranty, 1000, date("2027-01-01")).status).toBe("EXPIRED");
    expect(warrantyState(warranty, 49000, date("2026-01-01")).status).toBe("SOON");
    expect(warrantyState({ ...warranty, startDate: date("2026-02-01") }, 1000, date("2026-01-01")).status).toBe("UPCOMING");
  });
  it("inclut les frais du jour d’achat même si leur heure précède celle de l’achat", () => {
    const vehicle = { purchasePrice: 10000, salePrice: null, purchaseDate: date("2026-01-01T12:00:00Z"), saleDate: null, purchaseMileage: 1000, finalMileage: null };
    const costs = [{ vehicleId: "car", date: date("2026-01-01"), category: "ASSURANCE", amount: 50 }];
    expect(ownershipStats(vehicle, 2000, costs, date("2026-02-01")).insurance).toBe(50);
  });
  it("fige la distance des pneus démontés", () => {
    expect(tireDistance({ mountedMileage: 1000, removedMileage: 2500 }, 4000)).toBe(1500);
    expect(tireDistance({ mountedMileage: 1000, removedMileage: null }, 4000)).toBe(3000);
  });
  it("attribue les intervalles aux années sans fuite de données futures", () => {
    const readings = [{ date: date("2025-12-31"), mileage: 1000 }, { date: date("2026-01-10"), mileage: 1200 }, { date: date("2027-01-01"), mileage: 2000 }];
    const stats = annualStats(2026, readings, [], [], date("2026-02-01")); expect(stats.distance).toBe(200); expect(stats.costPerKm).toBe(0); expect(stats.consumption).toBeNull();
    expect(monthKey(date("2026-01-31T23:30:00Z"))).toBe("2026-02");
  });
});
