"use client";
import { Button } from "@/components/ui/button";
export function OpenSharing({ vehicleId }: { vehicleId: string }) {
  return <Button type="button" variant="outline" className="mt-3 min-h-11" onClick={() => {
    const target = document.getElementById(`partages-${vehicleId}`);
    if (target instanceof HTMLDetailsElement) {
      target.open = true; target.scrollIntoView({ block: "start" }); target.querySelector("summary")?.focus({ preventScroll: true });
    }
  }}>Partager le véhicule</Button>;
}
