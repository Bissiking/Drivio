"use client";

import { useMemo } from "react";
import { isNativePlatform, getPlatform } from "@/lib/capacitor";

export function useCapacitor() {
  const isNative = useMemo(() => isNativePlatform(), []);
  const platform = useMemo(() => getPlatform(), []);

  return { isNative, platform };
}
