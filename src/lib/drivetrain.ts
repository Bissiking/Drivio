export const DRIVETRAINS = ["UNKNOWN", "FRONT", "REAR", "AWD"] as const;

export const drivetrainLabels: Record<string, string> = {
  UNKNOWN: "Transmission non renseignée",
  FRONT: "Traction avant",
  REAR: "Propulsion arrière",
  AWD: "Transmission intégrale",
};
