"use client";

// ثبت Service Worker برای PWA و اشتراک Push Notification
import { useEffect } from "react";
import { isNativeApp } from "@/lib/native";

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

    // در اپ نیتیو (WebView کاپسیتور) سرویس ورکر نداریم — کش cache-first روی
    // chunk های _next می تواند نسخه stale را به جای بیلد تازه بدهد و اپ را فلج کند.
    // هر رجیستر و کش قبلی هم پاک می شود تا نصب های قدیمی پاک شوند
    if (isNativeApp()) {
      navigator.serviceWorker.getRegistrations().then((regs) => {
        regs.forEach((r) => r.unregister());
      });
      caches.keys().then((keys) => keys.forEach((k) => caches.delete(k)));
      return;
    }

    // سرویس ورکر فقط برای مرورگر/PWA فعال است — کش API ندارد
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
