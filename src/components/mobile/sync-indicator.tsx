"use client";

import { useState, useEffect } from "react";
import { RefreshCw, AlertCircle, Check, CloudOff } from "lucide-react";
import { useSyncStatus, type SyncStatus } from "@/hooks/use-sync-status";
import { cn } from "@/lib/utils";
import { isNativePlatform } from "@/lib/capacitor";

interface SyncIndicatorProps {
  apiBaseUrl: string;
  className?: string;
}

const STATUS_CONFIG: Record<SyncStatus, { icon: typeof RefreshCw; label: string; color: string }> = {
  idle: { icon: Check, label: "Synchronisé", color: "text-emerald-400" },
  syncing: { icon: RefreshCw, label: "Synchronisation...", color: "text-blue-400" },
  error: { icon: AlertCircle, label: "Erreur de sync", color: "text-amber-400" },
};

export function SyncIndicator({ apiBaseUrl, className }: SyncIndicatorProps) {
  const { status, pendingCount } = useSyncStatus(apiBaseUrl);

  if (!isNativePlatform()) return null;

  const config = STATUS_CONFIG[status];
  const Icon = config.icon;

  return (
    <div
      className={cn(
        "flex items-center gap-2 rounded-full px-3 py-1.5 text-xs",
        "bg-[var(--surface)] text-[var(--muted)]",
        className
      )}
    >
      <Icon
        className={cn(
          "size-3.5",
          config.color,
          status === "syncing" && "animate-spin"
        )}
        strokeWidth={2}
      />
      <span>{config.label}</span>
      {pendingCount > 0 && (
        <span className="ml-1 rounded-full bg-[var(--surface-soft)] px-1.5 py-0.5 text-[10px] text-[var(--quiet)]">
          {pendingCount}
        </span>
      )}
    </div>
  );
}

interface OfflineBadgeProps {
  className?: string;
}

export function OfflineBadge({ className }: OfflineBadgeProps) {
  const [isOnline, setIsOnline] = useState(true);

  useEffect(() => {
    if (!isNativePlatform()) return;

    let mounted = true;

    const checkOnline = async () => {
      const { getNetworkStatus } = await import("@/lib/capacitor");
      const status = await getNetworkStatus();
      if (mounted) setIsOnline(status.connected);
    };

    checkOnline();

    const handleOnline = () => {
      if (mounted) setIsOnline(true);
    };
    const handleOffline = () => {
      if (mounted) setIsOnline(false);
    };

    window.addEventListener("online", handleOnline);
    window.addEventListener("offline", handleOffline);

    return () => {
      mounted = false;
      window.removeEventListener("online", handleOnline);
      window.removeEventListener("offline", handleOffline);
    };
  }, []);

  if (isOnline || !isNativePlatform()) return null;

  return (
    <div
      className={cn(
        "flex items-center gap-2 rounded-full bg-amber-500/10 px-3 py-1.5 text-xs text-amber-400",
        className
      )}
    >
      <CloudOff className="size-3.5" strokeWidth={2} />
      <span>Hors ligne</span>
    </div>
  );
}
