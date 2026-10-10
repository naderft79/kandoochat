"use client";

// ثبت Service Worker برای PWA و اشتراک Push Notification
import { useEffect } from "react";

async function subscribePush(registration: ServiceWorkerRegistration) {
  if (!("Notification" in window) || !("PushManager" in window)) return;
  const publicKey = process.env.NEXT_PUBLIC_VAPID_PUBLIC_KEY;
  if (!publicKey) return;

  // فقط اگر کاربر قبلا اجازه داده باشد — درخواست مجوز از طریق شیت رضایت انجام می شود
  if (Notification.permission !== "granted") return;

  try {
    const subscription = await registration.pushManager.subscribe({
      userVisibleOnly: true,
      applicationServerKey: urlBase64ToUint8Array(publicKey),
    });

    await fetch("/api/push/subscribe", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(subscription),
    });
  } catch (err) {
    console.error("[PWA] push subscribe failed:", err);
  }
}

function urlBase64ToUint8Array(base64String: string) {
  const padding = "=".repeat((4 - (base64String.length % 4)) % 4);
  const base64 = (base64String + padding).replace(/-/g, "+").replace(/_/g, "/");
  const rawData = atob(base64);
  return Uint8Array.from([...rawData].map((char) => char.charCodeAt(0)));
}

export default function ServiceWorkerRegister() {
  useEffect(() => {
    if (!("serviceWorker" in navigator)) return;

    // سرویس ورکر همیشه فعال است — sw.js کد و API را کش نمی کند پس در dev هم امن است
    navigator.serviceWorker
      .register("/sw.js")
      .then((registration) => {
        console.log("[PWA] Service Worker registered");
        subscribePush(registration);
      })
      .catch((err) => console.error("[PWA] SW registration failed:", err));
  }, []);

  return null;
}
