"use client";

import { useEffect } from "react";

const CHECK_INTERVAL_MS = 60 * 1000;

export function SessionKeeper() {
  useEffect(() => {
    let running = false;

    async function keepAlive() {
      if (running || !navigator.onLine) return;
      running = true;
      try {
        const response = await fetch("/api/auth/refresh", {
          method: "POST",
          cache: "no-store",
          credentials: "same-origin",
        });
        if (response.status === 401) window.location.replace("/connexion?error=Votre%20session%20Kyros%20a%20expir%C3%A9.");
      } catch {
        // Une perte réseau mobile ne doit jamais provoquer une déconnexion.
      } finally {
        running = false;
      }
    }

    void keepAlive();
    const interval = window.setInterval(() => void keepAlive(), CHECK_INTERVAL_MS);
    const onResume = () => {
      if (document.visibilityState === "visible") void keepAlive();
    };
    window.addEventListener("online", keepAlive);
    window.addEventListener("pageshow", keepAlive);
    document.addEventListener("visibilitychange", onResume);
    return () => {
      window.clearInterval(interval);
      window.removeEventListener("online", keepAlive);
      window.removeEventListener("pageshow", keepAlive);
      document.removeEventListener("visibilitychange", onResume);
    };
  }, []);

  return null;
}
