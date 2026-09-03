import {
  Geolocation,
  type Position,
  type PositionOptions,
} from "@capacitor/geolocation";
import { isNativePlatform } from "./is-native";

export interface GeoPosition {
  latitude: number;
  longitude: number;
  accuracy: number;
  altitude: number | null;
  timestamp: number;
}

export async function requestLocationPermission(): Promise<boolean> {
  if (!isNativePlatform()) return false;

  const perm = await Geolocation.requestPermissions();
  return perm.location === "granted";
}

export async function getCurrentPosition(
  options?: PositionOptions
): Promise<GeoPosition | null> {
  if (!isNativePlatform()) return null;

  try {
    const pos: Position = await Geolocation.getCurrentPosition({
      enableHighAccuracy: true,
      timeout: 10000,
      maximumAge: 30000,
      ...options,
    });

    return {
      latitude: pos.coords.latitude,
      longitude: pos.coords.longitude,
      accuracy: pos.coords.accuracy,
      altitude: pos.coords.altitude,
      timestamp: pos.timestamp,
    };
  } catch {
    return null;
  }
}

export type PositionCallback = (position: GeoPosition | null) => void;

export async function watchPosition(
  callback: PositionCallback,
  options?: PositionOptions
): Promise<string | null> {
  if (!isNativePlatform()) return null;

  const watchId = await Geolocation.watchPosition(
    {
      enableHighAccuracy: true,
      ...options,
    },
    (position: Position | null) => {
      if (position) {
        callback({
          latitude: position.coords.latitude,
          longitude: position.coords.longitude,
          accuracy: position.coords.accuracy,
          altitude: position.coords.altitude,
          timestamp: position.timestamp,
        });
      } else {
        callback(null);
      }
    }
  );

  return watchId?.toString() ?? null;
}

export async function clearWatch(watchId: string): Promise<void> {
  if (!isNativePlatform()) return;

  await Geolocation.clearWatch({ id: watchId });
}
