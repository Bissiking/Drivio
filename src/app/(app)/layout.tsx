// src/app/(app)/layout.tsx
import { SessionKeeper } from "@/components/auth/session-keeper";
import { Navigation } from "@/components/layout/navigation";
import { requirePageUser } from "@/lib/auth";
import { FuelModal } from "@/components/forms/fuel-modal";
import { db } from "@/lib/db";

export default async function AppLayout({ children }: { children: React.ReactNode }) {
  const user = await requirePageUser();
  const vehicles = user.autoFuelMobile || user.autoFuelDesktop ? await db.vehicle.findMany({ where: { userId: user.id, status: "ACTIVE" }, select: { id: true, brand: true, model: true }, orderBy: { isPrimary: "desc" } }) : [];
  return <div className="min-h-screen"><SessionKeeper /><Navigation /><FuelModal automatic vehicles={vehicles} mobile={user.autoFuelMobile} desktop={user.autoFuelDesktop} /><main className="min-h-screen px-4 pb-28 pt-6 sm:px-7 lg:ml-60 lg:px-9 lg:pb-10 lg:pt-8 xl:px-12">{children}</main></div>;
}
