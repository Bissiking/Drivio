import {
  PushNotifications,
  type Token,
  type PushNotificationSchema,
  type ActionPerformed,
} from "@capacitor/push-notifications";
import { isNativePlatform } from "./is-native";

export interface PushToken {
  value: string;
}

export async function requestPushPermissions(): Promise<boolean> {
  if (!isNativePlatform()) return false;

  const perm = await PushNotifications.requestPermissions();
  return perm.receive === "granted";
}

export async function registerForPush(): Promise<PushToken | null> {
  if (!isNativePlatform()) return null;

  await PushNotifications.register();

  return new Promise((resolve) => {
    const timeout = setTimeout(() => resolve(null), 10000);

    PushNotifications.addListener("registration", (token: Token) => {
      clearTimeout(timeout);
      resolve({ value: token.value });
    });

    PushNotifications.addListener("registrationError", () => {
      clearTimeout(timeout);
      resolve(null);
    });
  });
}

export type NotificationReceivedCallback = (
  notification: PushNotificationSchema
) => void;

export type NotificationTapCallback = (
  notification: PushNotificationSchema,
  action?: string
) => void;

let receivedHandle: { remove: () => Promise<void> } | null = null;
let actionHandle: { remove: () => Promise<void> } | null = null;

export function onNotificationReceived(callback: NotificationReceivedCallback): () => Promise<void> {
  if (!isNativePlatform()) {
    return async () => {};
  }

  let active = true;

  (async () => {
    const handle = await PushNotifications.addListener(
      "pushNotificationReceived",
      (notification: PushNotificationSchema) => {
        if (active) callback(notification);
      }
    );
    receivedHandle = handle;
  })();

  return async () => {
    active = false;
    if (receivedHandle) {
      await receivedHandle.remove();
      receivedHandle = null;
    }
  };
}

export function onNotificationTap(callback: NotificationTapCallback): () => Promise<void> {
  if (!isNativePlatform()) {
    return async () => {};
  }

  let active = true;

  (async () => {
    const handle = await PushNotifications.addListener(
      "pushNotificationActionPerformed",
      (action: ActionPerformed) => {
        if (active) callback(action.notification, action.actionId);
      }
    );
    actionHandle = handle;
  })();

  return async () => {
    active = false;
    if (actionHandle) {
      await actionHandle.remove();
      actionHandle = null;
    }
  };
}

export async function getDeliveredNotifications(): Promise<PushNotificationSchema[]> {
  if (!isNativePlatform()) return [];

  const result = await PushNotifications.getDeliveredNotifications();
  return result.notifications;
}

export async function removeAllDeliveredNotifications(): Promise<void> {
  if (!isNativePlatform()) return;

  await PushNotifications.removeAllDeliveredNotifications();
}
