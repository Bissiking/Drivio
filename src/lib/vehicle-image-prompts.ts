// src/lib/vehicle-image-prompts.ts
export type VehiclePromptIdentity = {
  brand: string;
  model: string;
  trim: string;
  powertrain: string | null;
  year: number;
};

export type VehiclePromptOptions = {
  color: string;
  bodyStyle: string;
  angle: string;
  scene: string;
  lighting: string;
  weather: string;
  imageStyle: string;
  aspectRatio: string;
  details?: string;
};

export function buildVehicleImagePrompt(vehicle: VehiclePromptIdentity, options: VehiclePromptOptions) {
  const identity = [
    `${vehicle.year} ${vehicle.brand} ${vehicle.model}`,
    `finition ${vehicle.trim}`,
    vehicle.powertrain ? `motorisation ${vehicle.powertrain}` : null,
  ].filter(Boolean).join(", ");

  return [
    "Créer une photographie automobile éditoriale réaliste et haut de gamme.",
    `Véhicule : ${identity}.`,
    `Carrosserie : ${options.bodyStyle}. Couleur extérieure exacte : ${options.color}.`,
    `Cadrage : ${options.angle}, véhicule entièrement visible, proportions réalistes, format ${options.aspectRatio}.`,
    `Décor : ${options.scene}. Éclairage : ${options.lighting}. Conditions : ${options.weather}.`,
    `Direction visuelle : ${options.imageStyle}.`,
    "Respecter fidèlement la carrosserie de série, la signature lumineuse, la calandre, les jantes et les détails propres au modèle et à son année.",
    options.details ? `Détails demandés : ${options.details}.` : null,
    "Image seule, sans personne, sans texte, sans filigrane, sans logo ajouté, sans plaque d’immatriculation lisible, sans déformation et sans élément de course.",
  ].filter(Boolean).join("\n");
}
