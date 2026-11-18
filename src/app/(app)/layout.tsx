import { vehicleWhere, shareFor, vehicleRights } from "@/lib/vehicle-access";
// src/app/(app)/layout.tsx
import { SessionKeeper } from "@/components/auth/session-keeper";
import { Navigation } from "@/components/layout/navigation";
import { requirePageUser } from "@/lib/auth";
import { FuelModal } from "@/components/forms/fuel-modal";
import { db } from "@/lib/db";

export default async function AppLayout({ children }: { children: React.ReactNode }) {
  const user = await requirePageUser();
  const accessible = await db.vehicle.findMany({ where: vehicleWhere(user.id), select: { id: true, userId: true, brand: true, model: true, status: true, isPrimary: true, shares: shareFor(user.id) }, orderBy: { isPrimary: "desc" } });
  const simpleOnly = accessible.length > 0 && accessible.every(v => vehicleRights(v, user.id).scope === "SIMPLE");
  const vehicles = user.autoFuelMobile || user.autoFuelDesktop ? accessible.filter(v => v.status === "ACTIVE" && vehicleRights(v, user.id).canWrite).map(({ id, brand, model }) => ({ id, brand, model })) : [];

  return <div className="min-h-screen"><SessionKeeper /><Navigation simpleOnly={simpleOnly} /><FuelModal automatic vehicles={vehicles} mobile={user.autoFuelMobile} desktop={user.autoFuelDesktop} /><main className="min-h-screen px-4 pb-28 pt-6 sm:px-7 lg:ml-60 lg:px-9 lg:pb-10 lg:pt-8 xl:px-12">{children}</main></div>;
}
