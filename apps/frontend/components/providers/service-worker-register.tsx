"use client";

import { useEffect } from "react";

export function ServiceWorkerRegister() {
  useEffect(() => {
    if (process.env.NODE_ENV !== "production") {
      return;
    }

    if (!("serviceWorker" in navigator)) {
      return;
    }

    if (!window.isSecureContext) {
      return;
    }

    navigator.serviceWorker.register("/sw.js", { scope: "/" }).catch((error) => {
      if (process.env.NODE_ENV !== "production") {
        console.warn("Service Worker registration failed:", error);
      }
    });
  }, []);

  return null;
}
