// src/app/(app)/layout.tsx
import { Navigation } from "@/components/layout/navigation";
import { requirePageUser } from "@/lib/auth";

export default async function AppLayout({ children }: { children: React.ReactNode }) {
  await requirePageUser();
  return <div className="min-h-screen"><Navigation /><main className="min-h-screen px-4 pb-28 pt-6 sm:px-7 lg:ml-60 lg:px-9 lg:pb-10 lg:pt-8 xl:px-12">{children}</main></div>;
}
