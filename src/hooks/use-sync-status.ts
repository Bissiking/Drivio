"use client";

import { useState, useEffect } from "react";
import { onSyncStatusChange, initSync, destroySync } from "@/lib/capacitor";
import { isNativePlatform } from "@/lib/capacitor";

export type SyncStatus = "idle" | "syncing" | "error";

export function useSyncStatus(apiBaseUrl: string) {
  const [status, setStatus] = useState<SyncStatus>("idle");
  const [pendingCount, setPendingCount] = useState(0);
  const [isInitialized, setIsInitialized] = useState(false);

  useEffect(() => {
    if (!isNativePlatform()) return;

    initSync(apiBaseUrl).then(() => setIsInitialized(true));

    const unsubscribe = onSyncStatusChange((newStatus, count) => {
      setStatus(newStatus);
      setPendingCount(count);
    });

    return () => {
      unsubscribe();
      destroySync();
    };
  }, [apiBaseUrl]);

  return { status, pendingCount, isInitialized };
}
