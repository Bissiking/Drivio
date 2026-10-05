// src/lib/constants.ts
export const VEHICLE_STATUSES = ["ACTIVE", "ARCHIVED"] as const;

export const MAINTENANCE_TYPES = [
  "VIDANGE",
  "FILTRES",
  "PNEUS",
  "FREINS",
  "DISTRIBUTION",
  "CONTROLE_TECHNIQUE",
  "ENTRETIEN_CONSTRUCTEUR",
  "PERSONNALISE",
  "PLAQUETTES", "DISQUES", "BATTERIE", "ESSUIE_GLACES", "LIQUIDE_FREIN", "BOUGIES",
] as const;

export const EXPENSE_CATEGORIES = [
  "CARBURANT",
  "ASSURANCE",
  "ENTRETIEN",
  "REPARATION",
  "PNEUS",
  "PEAGE",
  "PARKING",
  "LAVAGE",
  "ACCESSOIRES",
  "AUTRE",
] as const;

export const LABELS: Record<string, string> = {
  PLAQUETTES: "Plaquettes", DISQUES: "Disques", BATTERIE: "Batterie", ESSUIE_GLACES: "Essuie-glaces", LIQUIDE_FREIN: "Liquide de frein", BOUGIES: "Bougies",
  ACTIVE: "Actif",
  ARCHIVED: "Archivé",
  VIDANGE: "Vidange",
  FILTRES: "Filtres",
  PNEUS: "Pneus",
  FREINS: "Freins",
  DISTRIBUTION: "Distribution",
  CONTROLE_TECHNIQUE: "Contrôle technique",
  ENTRETIEN_CONSTRUCTEUR: "Entretien constructeur",
  PERSONNALISE: "Personnalisé",
  CARBURANT: "Carburant",
  ASSURANCE: "Assurance",
  ENTRETIEN: "Entretien",
  REPARATION: "Réparation",
  PEAGE: "Péage",
  PARKING: "Parking",
  LAVAGE: "Lavage",
  ACCESSOIRES: "Accessoires",
  AUTRE: "Autre",
};
