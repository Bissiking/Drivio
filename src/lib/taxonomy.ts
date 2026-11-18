import { LABELS } from "./constants";

// The leaf is persisted as MaintenanceRecord.type / MaintenanceSchedule.type.
// Historical generic leaves remain selectable and are never inferred from titles.
export const MAINTENANCE_GROUPS = [
  { id: "FREINAGE", label: "Freinage", generic: "FREINS", types: ["PLAQUETTES", "DISQUES", "LIQUIDE_FREIN", "ETRIERS", "FREINS"] },
  { id: "MOTEUR", label: "Moteur", generic: "MOTEUR", types: ["VIDANGE", "BOUGIES", "DISTRIBUTION", "REFROIDISSEMENT", "MOTEUR"] },
  { id: "TRANSMISSION", label: "Transmission", generic: "TRANSMISSION", types: ["BOITE_VITESSES", "EMBRAYAGE", "HUILE_BOITE", "TRANSMISSION"] },
  { id: "ECHAPPEMENT", label: "Échappement", generic: "ECHAPPEMENT", types: ["CATALYSEUR", "SILENCIEUX", "LIGNE_ECHAPPEMENT", "ECHAPPEMENT"] },
  { id: "CARROSSERIE", label: "Carrosserie", generic: "CARROSSERIE", types: ["PEINTURE", "PARE_CHOCS", "REPARATION_CARROSSERIE", "CARROSSERIE"] },
  { id: "PNEUMATIQUES", label: "Pneumatiques", generic: "PNEUS", types: ["REMPLACEMENT_PNEUS", "EQUILIBRAGE", "GEOMETRIE", "PNEUS"] },
  { id: "FILTRATION", label: "Filtres", generic: "FILTRES", types: ["FILTRE_HUILE", "FILTRE_AIR", "FILTRE_HABITACLE", "FILTRE_CARBURANT", "FILTRES"] },
  { id: "TRAINS_ROULANTS", label: "Suspension et direction", generic: "TRAINS_ROULANTS", types: ["SUSPENSION", "DIRECTION", "TRAINS_ROULANTS"] },
  { id: "ELECTRICITE", label: "Électricité et visibilité", generic: "ELECTRICITE", types: ["BATTERIE", "ESSUIE_GLACES", "ECLAIRAGE", "ELECTRICITE"] },
  { id: "CONTROLES", label: "Révisions et contrôles", generic: "CONTROLES", types: ["ENTRETIEN_CONSTRUCTEUR", "CONTROLE_TECHNIQUE", "CONTROLES"] },
  { id: "PERSONNALISE", label: "À classer / personnalisé", generic: "PERSONNALISE", types: ["PERSONNALISE"] },
] as const;

export const EXPENSE_SUBTYPES: Record<string, readonly [string, string][]> = {
  CARBURANT: [["PLEIN", "Plein"], ["RECHARGE", "Recharge électrique"], ["ADBLUE", "AdBlue"]],
  ASSURANCE: [["COTISATION", "Cotisation"], ["FRANCHISE", "Franchise"]],
  ENTRETIEN: [["REVISION", "Révision"], ["VIDANGE", "Vidange"], ["FILTRES", "Filtres"], ["FREINAGE", "Freinage"], ["DISTRIBUTION", "Distribution"], ["CONTROLE", "Contrôle technique"]],
  REPARATION: [["MOTEUR", "Moteur et transmission"], ["CARROSSERIE", "Carrosserie"], ["ELECTRICITE", "Électricité"], ["ROULANT", "Trains roulants"]],
  PNEUS: [["ACHAT", "Achat de pneus"], ["MONTAGE", "Montage et équilibrage"], ["GEOMETRIE", "Géométrie"], ["STOCKAGE", "Stockage"]],
  PEAGE: [["PASSAGE", "Passage"], ["ABONNEMENT", "Abonnement"]],
  PARKING: [["PONCTUEL", "Stationnement ponctuel"], ["ABONNEMENT", "Abonnement"]],
  LAVAGE: [["EXTERIEUR", "Extérieur"], ["INTERIEUR", "Intérieur"], ["COMPLET", "Complet"]],
  ACCESSOIRES: [["EQUIPEMENT", "Équipement"], ["CONFORT", "Confort"], ["SECURITE", "Sécurité"]],
  AUTRE: [["ADMINISTRATIF", "Frais administratifs"], ["DIVERS", "Divers"]],
};

export function maintenanceGroup(type: string) {
  return MAINTENANCE_GROUPS.find(group => (group.types as readonly string[]).includes(type));
}
export function maintenanceClassification(type: string) {
  const group = maintenanceGroup(type);
  return { category: group && group.id !== "PERSONNALISE" ? group.id : null, subcategory: group && group.generic !== type ? type : null };
}
export function maintenanceLabel(type: string) {
  const group = maintenanceGroup(type);
  return group ? group.generic === type ? group.label : `${group.label} · ${LABELS[type] ?? type}` : LABELS[type] ?? type;
}
export function expenseLabel(category: string, subcategory?: string | null) {
  const subtype = EXPENSE_SUBTYPES[category]?.find(([id]) => id === subcategory)?.[1];
  return `${LABELS[category] ?? category}${subtype ? ` · ${subtype}` : ""}`;
}
