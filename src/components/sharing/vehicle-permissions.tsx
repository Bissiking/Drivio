"use client";
import { createContext, useContext } from "react";
const WritableVehicle = createContext(true);
export const useVehicleWrite = () => useContext(WritableVehicle);
export function VehiclePermissions({ canWrite, children }: { canWrite: boolean; children: React.ReactNode }) {
  return <WritableVehicle.Provider value={canWrite}>{children}</WritableVehicle.Provider>;
}
export function MutationOnly({ children }: { children: React.ReactNode }) {
  return useVehicleWrite() ? children : null;
}
export function PermissionText({ write, read }: { write: string; read: string }) {
  return useVehicleWrite() ? write : read;
}
