import type { ReactNode } from "react";
import {
  mdiAirConditioner, mdiAirFilter, mdiCarBattery, mdiCarBrakeAlert,
  mdiCarBrakeFluidLevel, mdiCarCog, mdiCarSearchOutline, mdiCarWrench,
  mdiCoolantTemperature, mdiEngineOutline, mdiFuel, mdiOil, mdiTire, mdiWiper,
} from "@mdi/js";
import { cn } from "@/lib/utils";

// Icon Pantry originals, adapted to JSX. Sources and licenses: docs/ICON_SOURCES.md.
const pantryIcons: Record<string, ReactNode> = {
  "brake-disc": <><path d="M17.73 11.93a8 8 0 1 1-5.66-5.66" /><circle cx="10" cy="14" r="2.5" /><path d="M12.72 3.86a10.5 10.5 0 0 1 7.42 7.42l-4.83 1.3a5.5 5.5 0 0 0-3.89-3.89Zm.46 13.32h.01m-6.37 0h.01m-.01-6.36h.01" /></>,
  "brake-pads": <path d="M5.11 17.79a9 9 0 0 1 0-11.58l2.68 2.25a5.5 5.5 0 0 0 0 7.08ZM18.89 6.21a9 9 0 0 1 0 11.58l-2.68-2.25a5.5 5.5 0 0 0 0-7.08ZM12 7v10" />,
  "timing-belt": <><path d="M7 7h10a5 5 0 0 1 0 10H7A5 5 0 0 1 7 7" /><circle cx="7" cy="12" r="2.5" /><circle cx="17" cy="12" r="2.5" /></>,
  "spark-plug": <><path d="M12 2v2" /><rect width="4" height="6" x="10" y="4" rx="1" /><rect width="8" height="3" x="8" y="10" rx=".5" /><path d="M9.5 13v5h5v-5m-5 2.5h5m0 2.5v3H12" /></>,
  "oil-filter": <><path d="M8 6V3.5h8V6" /><rect width="14" height="15" x="5" y="6" rx="2" /><path d="M12 10s-2.5 2.8-2.5 4.5a2.5 2.5 0 0 0 5 0c0-1.7-2.5-4.5-2.5-4.5" /></>,
  "shock-absorber": <><circle cx="12" cy="3.5" r="1.5" /><circle cx="12" cy="20.5" r="1.5" /><path d="M7 6h10M7 18h10M8 6l8 3-8 3 8 3-8 3m4-13v1m0 12v1" /></>,
  gearbox: <><circle cx="12" cy="5" r="3" /><path d="M12 8v8m-5 5 2-5h6l2 5Z" /></>,
  turbocharger: <><path d="M10 7h10.5v4.5h-4" /><path d="M16.54 11.5A7 7 0 1 1 10 7" /><circle cx="10" cy="14" r="1.2" /><path d="M11.56 15.56q.24 1.56-2.32 2.77m-.8-2.77q-1.56.24-2.77-2.32m2.77-.8q-.24-1.56 2.32-2.77m.8 2.77q1.56-.24 2.77 2.32" /></>,
};

const pantryTypes: Record<string, string> = {
  PLAQUETTES: "brake-pads", DISQUES: "brake-disc", DISTRIBUTION: "timing-belt", BOUGIES: "spark-plug",
};
const mdiTypes: Record<string, string> = {
  VIDANGE: mdiOil, FILTRES: mdiAirFilter, PNEUS: mdiTire, FREINS: mdiCarBrakeAlert,
  CONTROLE_TECHNIQUE: mdiCarSearchOutline, ENTRETIEN_CONSTRUCTEUR: mdiCarCog,
  BATTERIE: mdiCarBattery, ESSUIE_GLACES: mdiWiper, LIQUIDE_FREIN: mdiCarBrakeFluidLevel,
};

export function MaintenanceIcon({ type, title, className }: { type: string; title: string; className?: string }) {
  const normalized = title.normalize("NFD").replace(/[\u0300-\u036f]/g, "").toLowerCase();
  let pantry = pantryTypes[type];
  let mdi = mdiTypes[type] ?? mdiCarWrench;
  if (["PERSONNALISE", "VIDANGE", "ENTRETIEN_CONSTRUCTEUR"].includes(type) && /\b(dsg|dq\d+|boite|transmission|embrayage)\b/.test(normalized)) pantry = "gearbox";
  if (type === "PERSONNALISE") {
    if (/\bturbo/.test(normalized)) pantry = "turbocharger";
    else if (/\b(amortisseur|suspension)/.test(normalized)) pantry = "shock-absorber";
    else if (/\b(moteur|piston)/.test(normalized)) mdi = mdiEngineOutline;
    else if (/\b(refroidissement|radiateur)/.test(normalized)) mdi = mdiCoolantTemperature;
  }
  if (type === "FILTRES") {
    if (/\bhuile\b/.test(normalized)) pantry = "oil-filter";
    else if (/\b(habitacle|pollen|climatisation)\b/.test(normalized)) mdi = mdiAirConditioner;
    else if (/\b(carburant|gazole|gasoil|essence)\b/.test(normalized)) mdi = mdiFuel;
  }
  if (type === "FREINS") {
    if (/\bplaquette/.test(normalized)) pantry = "brake-pads";
    else if (/\bdisque/.test(normalized)) pantry = "brake-disc";
  }
  const shape = pantry ? pantryIcons[pantry] : undefined;
  return <svg aria-hidden="true" focusable="false" viewBox="0 0 24 24" width="24" height="24" className={cn("size-5 shrink-0", className)} fill={shape ? "none" : "currentColor"} stroke={shape ? "currentColor" : undefined} strokeWidth={shape ? 1.7 : undefined} strokeLinecap={shape ? "round" : undefined} strokeLinejoin={shape ? "round" : undefined}>
    {shape ?? <path d={mdi} />}
  </svg>;
}
