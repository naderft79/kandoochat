"use client";

// ثبت Service Worker برای PWA — پوش نوتیفیکیشن غیرفعال است (اعلان ها فقط داخل برنامه)
import { useEffect } from "react";
import { isNativeApp } from "@/lib/native";

// لغو اشتراک Push قدیمی اگر قبلا فعال شده باشد — جلوگیری از اسپم نوتیفیکیشن مرورگر
async function unsubscribePush(registration: ServiceWorkerRegistration) {
  if (!("PushManager" in window)) return;
  try {
    const subscription = await registration.pushManager.getSubscription();
    if (!subscription) return;
    await subscription.unsubscribe();
    await fetch("/api/push/unsubscribe", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ endpoint: subscription.endpoint }),
    });
  } catch (err) {
    console.error("[PWA] push unsubscribe failed:", err);
  }
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
        unsubscribePush(registration);
      })
      .catch((err) => console.error("[PWA] SW registration failed:", err));
  }, []);

  return null;
}
