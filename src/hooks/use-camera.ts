"use client";

import { useState, useCallback } from "react";
import { takePhoto, pickFromGallery, pickImage, type CapturedPhoto } from "@/lib/capacitor";
import { isNativePlatform } from "@/lib/capacitor";

interface UseCameraOptions {
  onCapture?: (photo: CapturedPhoto) => void;
}

export function useCamera({ onCapture }: UseCameraOptions = {}) {
  const [photo, setPhoto] = useState<CapturedPhoto | null>(null);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const capture = useCallback(async () => {
    if (!isNativePlatform()) {
      setError("La caméra n'est disponible que sur mobile");
      return;
    }

    setIsLoading(true);
    setError(null);

    try {
      const result = await takePhoto();
      if (result) {
        setPhoto(result);
        onCapture?.(result);
      }
    } catch (err) {
      setError(err instanceof Error ? err.message : "Erreur lors de la capture");
    } finally {
      setIsLoading(false);
    }
  }, [onCapture]);

  const pickFromLib = useCallback(async () => {
    if (!isNativePlatform()) {
      setError("La galerie n'est disponible que sur mobile");
      return;
    }

    setIsLoading(true);
    setError(null);

    try {
      const result = await pickFromGallery();
      if (result) {
        setPhoto(result);
        onCapture?.(result);
      }
    } catch (err) {
      setError(err instanceof Error ? err.message : "Erreur lors de la sélection");
    } finally {
      setIsLoading(false);
    }
  }, [onCapture]);

  const pick = useCallback(async () => {
    if (!isNativePlatform()) {
      setError("La caméra n'est disponible que sur mobile");
      return;
    }

    setIsLoading(true);
    setError(null);

    try {
      const result = await pickImage();
      if (result) {
        setPhoto(result);
        onCapture?.(result);
      }
    } catch (err) {
      setError(err instanceof Error ? err.message : "Erreur lors de la sélection");
    } finally {
      setIsLoading(false);
    }
  }, [onCapture]);

  const reset = useCallback(() => {
    setPhoto(null);
    setError(null);
  }, []);

  return {
    photo,
    isLoading,
    error,
    capture,
    pickFromLib,
    pick,
    reset,
    isNative: isNativePlatform(),
  };
}
