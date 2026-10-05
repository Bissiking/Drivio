const normalize = (value: string) => value.trim().toLowerCase().normalize("NFD").replace(/[\u0300-\u036f]/g, "");
export const MODEL_IMAGES = [
  { brand: "CUPRA", model: "Formentor", path: "/vehicles/cupra-formentor.webp" },
  { brand: "Renault", model: "Clio", path: "/vehicles/renault-clio.webp" },
  { brand: "Peugeot", model: "308", path: "/vehicles/peugeot-308.webp" },
] as const;
export function vehicleImage(vehicle: { brand: string; model: string; photoPath?: string | null; photoUrl?: string | null }) {
  if (vehicle.photoPath || vehicle.photoUrl) return { src: vehicle.photoPath || vehicle.photoUrl!, illustrative: false };
  const model = MODEL_IMAGES.find(item => normalize(item.brand) === normalize(vehicle.brand) && normalize(vehicle.model).startsWith(normalize(item.model)));
  return { src: model?.path ?? "/vehicles/generic.webp", illustrative: true };
}
