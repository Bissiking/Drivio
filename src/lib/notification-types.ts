export const NOTIFICATION_TYPES = ["maintenanceSoon", "maintenanceOverdue", "maintenanceMileage", "warrantySoon", "warrantyExpired", "inspectionSoon", "inspectionOverdue", "insurance"] as const;
export type NotificationType = (typeof NOTIFICATION_TYPES)[number];
export const NOTIFICATION_LABELS: Record<NotificationType, string> = {
  maintenanceSoon: "Entretien bientôt dû par date", maintenanceOverdue: "Entretien dépassé", maintenanceMileage: "Kilométrage d’entretien bientôt atteint",
  warrantySoon: "Garantie proche de l’expiration", warrantyExpired: "Garantie expirée", inspectionSoon: "Contrôle technique ou contre-visite à venir", inspectionOverdue: "Contrôle technique ou contre-visite dépassé", insurance: "Assurance à renouveler",
};
