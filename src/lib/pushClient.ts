"use client";

// درخواست مجوز اعلان و اشتراک Push — بعد از ثبت نام و ورود صدا زده می شود
// وب/ PWA: Web Push با VAPID — اپ اندروید (Capacitor): Local Notifications
// FCM در نسخه اول گوگل پلی وجود ندارد؛ برای برگرداندن آن @capacitor/push-notifications
// را نصب و initNativePush را فعال کنید

function urlBase64ToUint8Array(base64String: string) {
  const padding = "=".repeat((4 - (base64String.length % 4)) % 4);
  const base64 = (base64String + padding).replace(/-/g, "+").replace(/_/g, "/");
  const rawData = atob(base64);
  return Uint8Array.from([...rawData].map((char) => char.charCodeAt(0)));
}

// اشتراک Web Push در مرورگر/PWA
async function subscribeWebPush(): Promise<void> {
  const publicKey = process.env.NEXT_PUBLIC_VAPID_PUBLIC_KEY;
  if (!publicKey) return;
  const registration = await navigator.serviceWorker.ready;
  const subscription = await registration.pushManager.subscribe({
    userVisibleOnly: true,
    applicationServerKey: urlBase64ToUint8Array(publicKey),
  });
  await fetch("/api/push/subscribe", {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(subscription),
  });
}

// مجوز + اشتراک اعلان — بعد از ثبت نام/ورود صدا زده می شود (بدون بلاک کردن جریان)
export async function requestPushPermission(): Promise<void> {
  if (typeof window === "undefined") return;

  // داخل اپ اندروید — فقط کانال محلی برای نوتیف های فورگراند (بدون FCM)
  try {
    const { Capacitor } = await import("@capacitor/core");
    if (Capacitor.isNativePlatform()) {
      const { LocalNotifications } = await import("@capacitor/local-notifications");
      const perm = await LocalNotifications.checkPermissions();
      if (perm.display !== "granted") await LocalNotifications.requestPermissions();
      // کانال با اهمیت بالا تا نوتیف ها heads-up و در نوار وضعیت دیده شوند
      await LocalNotifications.createChannel({
        id: "kandoo_alerts",
        name: "اعلان های کندو",
        description: "لایک، پیام و رویدادهای کندو",
        importance: 5,
        visibility: 1,
        vibration: true,
        lights: true,
      });
      return;
    }
  } catch {
    // Capacitor در دسترس نیست — ادامه با Web Push
  }

  if (!("Notification" in window) || !("serviceWorker" in navigator) || !("PushManager" in window)) return;
  try {
    const permission = await Notification.requestPermission();
    if (permission !== "granted") return;
    await subscribeWebPush();
  } catch (err) {
    console.error("[PWA] push permission/subscribe failed:", err);
  }
}

// شناسه های اعلان نمایش داده شده — جلوگیری از تکرار
const shownNotifIds = new Set<string>();

// نمایش اعلان در بخش نوتیفیکیشن گوشی — از رویداد زنده SSE صدا زده می شود
export async function fireSystemNotification(title: string, body: string, url?: string, dedupeId?: string): Promise<void> {
  if (typeof window === "undefined") return;
  if (dedupeId) {
    if (shownNotifIds.has(dedupeId)) return;
    shownNotifIds.add(dedupeId);
    if (shownNotifIds.size > 300) shownNotifIds.delete(shownNotifIds.values().next().value as string);
  }

  // اپ اندروید — نوتیفیکیشن بومی فقط وقتی اپ در پس زمینه است
  // وقتی کاربر داخل اپ است فقط توست داخلی نمایش داده می شود
  try {
    const { Capacitor } = await import("@capacitor/core");
    if (Capacitor.isNativePlatform()) {
      if (document.visibilityState === "visible") return;
      const { LocalNotifications } = await import("@capacitor/local-notifications");
      const perm = await LocalNotifications.checkPermissions();
      if (perm.display !== "granted") return;
      // اطمینان از وجود کانال — اگر کاربر هنوز جریان ثبت نام را نگذرانده
      await LocalNotifications.createChannel({
        id: "kandoo_alerts",
        name: "اعلان های کندو",
        description: "لایک، پیام و رویدادهای کندو",
        importance: 5,
        visibility: 1,
        vibration: true,
        lights: true,
      });
      await LocalNotifications.schedule({
        notifications: [
          {
            id: Math.floor(Math.random() * 2147483647),
            title,
            body,
            channelId: "kandoo_alerts",
            extra: url ? { url } : undefined,
            // آیکن وضعیت: K سفید روی زمینه شفاف
            smallIcon: "ic_stat_kandoo",
          },
        ],
      });
      return;
    }
  } catch {
    // در دسترس نیست
  }

  // وب/PWA — فقط وقتی تب مخفی است تا با توست داخل اپ تکراری نشود
  if (document.visibilityState !== "hidden") return;
  if (!("Notification" in window) || Notification.permission !== "granted") return;
  try {
    const registration = await navigator.serviceWorker.ready;
    await registration.showNotification(title, {
      body,
      icon: "/icon-192.png",
      badge: "/icon-192.png",
      data: url ? { url } : undefined,
    });
  } catch (err) {
    console.error("[PWA] system notification failed:", err);
  }
}
