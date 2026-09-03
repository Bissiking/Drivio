export { isNativePlatform, getPlatform } from "./is-native";
export { takePhoto, pickFromGallery, pickImage } from "./camera";
export type { CapturedPhoto } from "./camera";
export {
  requestLocationPermission,
  getCurrentPosition,
  watchPosition,
  clearWatch,
} from "./geolocation";
export type { GeoPosition, PositionCallback } from "./geolocation";
export {
  getNetworkStatus,
  onNetworkChange,
} from "./network";
export type { ConnectivityStatus, NetworkChangeCallback, NetworkStatusType } from "./network";
export {
  requestPushPermissions,
  registerForPush,
  onNotificationReceived,
  onNotificationTap,
  getDeliveredNotifications,
  removeAllDeliveredNotifications,
} from "./push-notifications";
export type { PushToken, NotificationReceivedCallback, NotificationTapCallback } from "./push-notifications";
export { initDatabase, getDb, closeDatabase } from "./sqlite";
export {
  upsertEntity,
  markSynced,
  markDeleted,
  getPendingChanges,
  enqueueChange,
  removeSyncedQueueItem,
  markQueueItemFailed,
  getUnsyncedCount,
} from "./offline-db";
export type { OfflineEntityType } from "./offline-db";
export { initSync, sync, destroySync, onSyncStatusChange } from "./sync-engine";
