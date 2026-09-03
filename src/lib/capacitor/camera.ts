import { Camera, CameraResultType, CameraSource, type Photo } from "@capacitor/camera";
import { isNativePlatform } from "./is-native";

export interface CapturedPhoto {
  base64: string;
  webPath?: string;
}

export async function takePhoto(): Promise<CapturedPhoto | null> {
  if (!isNativePlatform()) return null;

  const photo: Photo = await Camera.getPhoto({
    quality: 85,
    allowEditing: false,
    resultType: CameraResultType.Base64,
    source: CameraSource.Camera,
    correctOrientation: true,
  });

  return {
    base64: photo.base64String ?? "",
    webPath: photo.webPath,
  };
}

export async function pickFromGallery(): Promise<CapturedPhoto | null> {
  if (!isNativePlatform()) return null;

  const photo: Photo = await Camera.getPhoto({
    quality: 85,
    allowEditing: false,
    resultType: CameraResultType.Base64,
    source: CameraSource.Photos,
    correctOrientation: true,
  });

  return {
    base64: photo.base64String ?? "",
    webPath: photo.webPath,
  };
}

export async function pickImage(): Promise<CapturedPhoto | null> {
  if (!isNativePlatform()) return null;

  const photo: Photo = await Camera.getPhoto({
    quality: 85,
    allowEditing: false,
    resultType: CameraResultType.Base64,
    source: CameraSource.Prompt,
    correctOrientation: true,
  });

  return {
    base64: photo.base64String ?? "",
    webPath: photo.webPath,
  };
}
