import { expect, it } from "vitest";
import { detectMaintenance } from "./maintenance-detection";
import { MAINTENANCE_TYPES } from "./constants";
import { MAINTENANCE_GROUPS, maintenanceClassification } from "./taxonomy";
import { maintenanceRecordSchema, maintenanceScheduleSchema } from "./validations";
it("classe chaque ancien et nouveau type exactement une fois", () => {
  const leaves = MAINTENANCE_GROUPS.flatMap(g => [...g.types]);
  expect(new Set(leaves).size).toBe(leaves.length); expect([...leaves].sort()).toEqual([...MAINTENANCE_TYPES].sort());
  expect(maintenanceClassification("FREINS")).toEqual({ category: "FREINAGE", subcategory: null });
  expect(maintenanceClassification("PLAQUETTES")).toEqual({ category: "FREINAGE", subcategory: "PLAQUETTES" });
  expect(maintenanceClassification("PERSONNALISE")).toEqual({ category: null, subcategory: null });
  expect(maintenanceClassification("TYPE_INCONNU")).toEqual({ category: null, subcategory: null });
});
it.each([
  ["Remplacement plaquettes avant", "PLAQUETTES"], ["Purge du liquide de frein", "LIQUIDE_FREIN"], ["Remplacement étriers", "ETRIERS"],
  ["Vidange moteur", "VIDANGE"], ["Vidange de la boîte", "HUILE_BOITE"], ["Remplacement de l’embrayage", "EMBRAYAGE"],
  ["Filtre d’habitacle", "FILTRE_HABITACLE"], ["Remplacement du filtre à huile", "FILTRE_HUILE"], ["Réglage parallélisme", "GEOMETRIE"],
  ["Remplacement des pneus", "REMPLACEMENT_PNEUS"], ["Catalyseur", "CATALYSEUR"], ["Peinture pare-chocs", null], ["Vidange et bougies", null], ["Intervention atelier", null],
])("propose sans imposer pour %s", (title, type) => expect(detectMaintenance(title).type).toBe(type));
it("conserve l’intitulé et déduit la classification du type explicitement choisi", () => {
  const record = maintenanceRecordSchema.parse({ vehicleId: "v", type: "BOUGIES", title: "Remplacement plaquettes avant", date: "2026-01-01", category: "FREINAGE" });
  expect(record.title).toBe("Remplacement plaquettes avant"); expect(record.category).toBe("MOTEUR"); expect(record.subcategory).toBe("BOUGIES");
  const schedule = maintenanceScheduleSchema.parse({ vehicleId: "v", type: "FILTRES", title: "Filtres à préciser", dueMileage: 50000 });
  expect(schedule.category).toBe("FILTRATION"); expect(schedule.subcategory).toBeNull();
});
