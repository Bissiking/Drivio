import { Network, type NetworkStatus } from "@capacitor/network";
import { isNativePlatform } from "./is-native";

export type NetworkStatusType = "wifi" | "cellular" | "none" | "unknown";

export interface ConnectivityStatus {
  connected: boolean;
  connectionType: NetworkStatusType;
}

export async function getNetworkStatus(): Promise<ConnectivityStatus> {
  if (!isNativePlatform()) {
    return {
      connected: navigator.onLine,
      connectionType: navigator.onLine ? "unknown" : "none",
    };
  }

  const status: NetworkStatus = await Network.getStatus();
  return {
    connected: status.connected,
    connectionType: status.connectionType as NetworkStatusType,
  };
}

export type NetworkChangeCallback = (status: ConnectivityStatus) => void;

let listeners: Array<{ remove: () => Promise<void> }> = [];

export async function onNetworkChange(
  callback: NetworkChangeCallback
): Promise<() => Promise<void>> {
  if (!isNativePlatform()) {
    const handler = () => {
      callback({
        connected: navigator.onLine,
        connectionType: navigator.onLine ? "unknown" : "none",
      });
    };
    window.addEventListener("online", handler);
    window.addEventListener("offline", handler);

    return async () => {
      window.removeEventListener("online", handler);
      window.removeEventListener("offline", handler);
    };
  }

  const handle = await Network.addListener(
    "networkStatusChange",
    (status: NetworkStatus) => {
      callback({
        connected: status.connected,
        connectionType: status.connectionType as NetworkStatusType,
      });
    }
  );

  listeners.push(handle);

  return async () => {
    await handle.remove();
    listeners = listeners.filter((l) => l !== handle);
  };
}
