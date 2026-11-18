"use client";
import { useVehicleWrite } from "@/components/sharing/vehicle-permissions";

export function TireRecordLink({ recordId }: { recordId: string }) {
  const canWrite = useVehicleWrite();
  const target = `tire-record-${recordId}`;
  return <a href={`#${target}`} onClick={() => {
    const details = document.getElementById(target);
    if (details instanceof HTMLDetailsElement) details.open = true;
  }} className="mt-2 inline-block py-1 text-xs text-[var(--accent)]">{canWrite ? "Voir ou modifier ce montage" : "Voir ce montage"}</a>;
}
