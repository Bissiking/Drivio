"use client";
import { Fuel } from "lucide-react";
import { Button } from "@/components/ui/button";
import { useQuickEntry, type EntryVehicle } from "./quick-entry";

export function FuelModal({ vehicles }: { vehicles: EntryVehicle[] }) {
  const { open } = useQuickEntry();
  if (!vehicles.length) return null;
  return <Button type="button" variant="outline" onClick={() => open("fuel", vehicles[0].id)}><Fuel className="size-4" />Ouvrir le formulaire en fenêtre</Button>;
}
