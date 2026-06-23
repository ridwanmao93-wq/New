"use client";

import { useEffect } from "react";

/** Registers the push/PWA service worker once on load. */
export function ServiceWorkerRegister() {
  useEffect(() => {
    if ("serviceWorker" in navigator) {
      navigator.serviceWorker.register("/sw.js").catch(() => {
        /* ignore registration failures (e.g. unsupported context) */
      });
    }
  }, []);
  return null;
}
