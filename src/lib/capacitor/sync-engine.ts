import { onNetworkChange, type ConnectivityStatus } from "./network";
import {
  getPendingChanges,
  removeSyncedQueueItem,
  markQueueItemFailed,
  markSynced,
  type OfflineEntityType,
} from "./offline-db";
import { isNativePlatform } from "./is-native";

type SyncStatus = "idle" | "syncing" | "error";

type StatusChangeCallback = (status: SyncStatus, pendingCount: number) => void;

let isSyncing = false;
let removeNetworkListener: (() => Promise<void>) | null = null;
let statusListeners: StatusChangeCallback[] = [];

export function onSyncStatusChange(callback: StatusChangeCallback): () => void {
  statusListeners.push(callback);
  return () => {
    statusListeners = statusListeners.filter((l) => l !== callback);
  };
}

function notifyListeners(status: SyncStatus, pendingCount: number) {
  for (const listener of statusListeners) {
    listener(status, pendingCount);
  }
}

export async function initSync(apiBaseUrl: string): Promise<void> {
  if (!isNativePlatform()) return;

  removeNetworkListener = await onNetworkChange(async (status: ConnectivityStatus) => {
    if (status.connected && !isSyncing) {
      await sync(apiBaseUrl);
    }
  });

  const status = await import("./network").then((m) => m.getNetworkStatus());
  if (status.connected) {
    await sync(apiBaseUrl);
  }
}

export async function sync(apiBaseUrl: string): Promise<void> {
  if (!isNativePlatform() || isSyncing) return;

  isSyncing = true;
  notifyListeners("syncing", 0);

  try {
    const pending = await getPendingChanges();
    let failedCount = 0;

    for (const item of pending) {
      try {
        const response = await fetch(`${apiBaseUrl}/api/v1/sync/push`, {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
            "X-Idempotency-Key": item.entityId,
          },
          body: JSON.stringify({
            entityType: item.entityType,
            entityId: item.entityId,
            operation: item.operation,
            payload: item.payload,
          }),
        });

        if (response.ok) {
          const result = await response.json();
          await markSynced(
            item.entityType as OfflineEntityType,
            item.entityId,
            result.version ?? 1
          );
          await removeSyncedQueueItem(item.entityId);
        } else if (response.status === 409) {
          await removeSyncedQueueItem(item.entityId);
        } else {
          throw new Error(`HTTP ${response.status}`);
        }
      } catch {
        failedCount++;
        await markQueueItemFailed(item.entityId);
      }
    }

    const remaining = await getPendingChanges();
    notifyListeners(failedCount > 0 ? "error" : "idle", remaining.length);
  } finally {
    isSyncing = false;
  }
}

export async function destroySync(): Promise<void> {
  if (removeNetworkListener) {
    await removeNetworkListener();
    removeNetworkListener = null;
  }
  statusListeners = [];
}
