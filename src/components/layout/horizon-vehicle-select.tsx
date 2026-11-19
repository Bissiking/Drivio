"use client";
import { useRouter } from "next/navigation";
import Image from "next/image";
import { useTransition } from "react";
import { ChevronDown } from "lucide-react";
import { formatNumber } from "@/lib/format";

export function HorizonVehicleSelect({ vehicles, selected, current, image }: { vehicles: { id: string; brand: string; model: string; status: string }[]; selected: string; current: number; image: { src: string; illustrative: boolean; unoptimized: boolean } }) {
  const router = useRouter();
  const [pending, startTransition] = useTransition();
  return <div className="horizon-vehicle-select" aria-busy={pending}><figure className="horizon-vehicle-thumb"><Image src={image.src} alt={image.illustrative ? "Illustration du véhicule" : "Véhicule sélectionné"} width={72} height={48} unoptimized={image.unoptimized} />{image.illustrative ? <figcaption>Illustration</figcaption> : null}</figure><div><label className="sr-only" htmlFor="horizon-vehicle">Véhicule affiché</label><select id="horizon-vehicle" value={selected} disabled={pending} onChange={event => { const id = event.target.value; startTransition(() => router.push(`/dashboard?vehicle=${encodeURIComponent(id)}`)); }}>{vehicles.map(vehicle => <option value={vehicle.id} key={vehicle.id}>{vehicle.brand} {vehicle.model}{vehicle.status === "ARCHIVED" ? " · Archivé" : ""}</option>)}</select><span>{pending ? "Chargement du véhicule…" : `${formatNumber(current, " km")} · compteur enregistré`}</span></div><ChevronDown aria-hidden="true" className="size-4 shrink-0" /></div>;
}
