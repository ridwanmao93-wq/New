"use client";

import { useEffect, useState } from "react";
import { Button } from "@/components/ui/button";

function urlBase64ToUint8Array(base64String: string) {
  const padding = "=".repeat((4 - (base64String.length % 4)) % 4);
  const base64 = (base64String + padding).replace(/-/g, "+").replace(/_/g, "/");
  const raw = atob(base64);
  const arr = new Uint8Array(raw.length);
  for (let i = 0; i < raw.length; i++) arr[i] = raw.charCodeAt(i);
  return arr;
}

export function EnablePush() {
  const [supported, setSupported] = useState<boolean | null>(null);
  const [subscribed, setSubscribed] = useState(false);
  const [status, setStatus] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);
  const [iosNeedsInstall, setIosNeedsInstall] = useState(false);
  const [testing, setTesting] = useState(false);

  useEffect(() => {
    const ok = "serviceWorker" in navigator && "PushManager" in window && "Notification" in window;
    setSupported(ok);

    const isIos = /iphone|ipad|ipod/i.test(navigator.userAgent);
    const standalone =
      window.matchMedia?.("(display-mode: standalone)").matches ||
      (navigator as any).standalone === true;
    if (isIos && !standalone) setIosNeedsInstall(true);

    if (ok) {
      navigator.serviceWorker.ready
        .then((reg) => reg.pushManager.getSubscription())
        .then((sub) => setSubscribed(!!sub))
        .catch(() => {});
    }
  }, []);

  async function enable() {
    setLoading(true);
    setStatus(null);
    try {
      const key = process.env.NEXT_PUBLIC_VAPID_PUBLIC_KEY;
      if (!key) throw new Error("Push isn’t configured yet (missing VAPID public key).");

      await navigator.serviceWorker.register("/sw.js");
      const permission = await Notification.requestPermission();
      if (permission !== "granted") {
        setStatus("Notifications are blocked. Enable them for this site in your browser settings.");
        setLoading(false);
        return;
      }

      const reg = await navigator.serviceWorker.ready;
      let sub = await reg.pushManager.getSubscription();
      if (!sub) {
        sub = await reg.pushManager.subscribe({
          userVisibleOnly: true,
          applicationServerKey: urlBase64ToUint8Array(key),
        });
      }

      const res = await fetch("/api/push/subscribe", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(sub),
      });
      const json = await res.json();
      if (!json.ok) throw new Error(json.error || "Could not save subscription");

      setSubscribed(true);
      setStatus("✅ Notifications enabled. You’ll get your morning, midday and evening nudges.");
    } catch (err) {
      setStatus(`⚠️ ${err instanceof Error ? err.message : "Something went wrong"}`);
    } finally {
      setLoading(false);
    }
  }

  async function sendTest() {
    setTesting(true);
    setStatus(null);
    try {
      const res = await fetch("/api/push/test", { method: "POST" });
      const json = await res.json();
      if (json.ok) {
        setStatus(`✅ Test sent to ${json.sent} device(s). Check your notifications.`);
      } else {
        setStatus(`⚠️ ${json.error}`);
      }
    } catch (err) {
      setStatus(`⚠️ ${err instanceof Error ? err.message : "Test failed"}`);
    } finally {
      setTesting(false);
    }
  }

  if (supported === false) {
    return (
      <p className="text-sm text-muted-foreground">
        This browser doesn’t support push notifications.
      </p>
    );
  }

  return (
    <div className="space-y-3">
      {iosNeedsInstall ? (
        <p className="rounded-md bg-amber-500/10 px-4 py-2.5 text-sm text-amber-200">
          On iPhone, first add this app to your Home Screen (Share → <strong>Add to Home Screen</strong>),
          then open it from the icon and tap “Enable” below. iOS only allows notifications from the
          installed app.
        </p>
      ) : null}

      <div className="flex flex-wrap gap-2">
        <Button onClick={enable} disabled={loading}>
          {loading ? "Enabling…" : subscribed ? "Re-enable notifications" : "Enable notifications"}
        </Button>
        <Button variant="outline" onClick={sendTest} disabled={testing}>
          {testing ? "Sending…" : "Send test notification"}
        </Button>
      </div>

      {subscribed ? (
        <p className="text-sm text-emerald-400">Notifications are on for this device.</p>
      ) : null}
      {status ? <p className="text-sm text-muted-foreground">{status}</p> : null}
    </div>
  );
}
