"use client";

// درخواست مجوز اعلان و اشتراک Push — بعد از ثبت نام و ورود صدا زده می شود
// وب/ PWA: Web Push با VAPID — اپ اندروید (Capacitor): FCM + Local Notifications
// FCM زمانی کار می کند که اپ بسته یا در پس زمینه است (تنها راه واقعی در اندروید)

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

// آپلود توکن FCM به سرور — ممکن است دوره ای رفرش شود
async function uploadFcmToken(token: string): Promise<void> {
  await fetch("/api/push/subscribe", {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ fcmToken: token, platform: "android" }),
  });
}

let nativePushReady = false;

// راه اندازی FCM — لیسنرها فقط یک بار ثبت می شوند
async function initNativePush(): Promise<void> {
  const { PushNotifications } = await import("@capacitor/push-notifications");

  if (!nativePushReady) {
    nativePushReady = true;
    await PushNotifications.addListener("registration", (t) => {
      void uploadFcmToken(t.value).catch((e) => console.error("[FCM] token upload failed:", e));
    });
    await PushNotifications.addListener("registrationError", (e) => {
      console.error("[FCM] registration error:", e.error);
    });
    // کلیک روی نوتیف — باز کردن لینک مربوطه
    await PushNotifications.addListener("pushNotificationActionPerformed", (action) => {
      const url = action.notification?.data?.url;
      if (typeof url === "string" && url.startsWith("/")) window.location.href = url;
    });
    // نوتیف موقع باز بودن اپ — SSE خودش بنر و نوتیف محلی را هندل می کند
    // پس اینجا کاری نمی کنیم تا تکراری نشود
  }

  let perm = await PushNotifications.checkPermissions();
  if (perm.receive !== "granted") perm = await PushNotifications.requestPermissions();
  if (perm.receive === "granted") await PushNotifications.register();
}

// مجوز + اشتراک اعلان — بعد از ثبت نام/ورود صدا زده می شود (بدون بلاک کردن جریان)
export async function requestPushPermission(): Promise<void> {
  if (typeof window === "undefined") return;

  // داخل اپ اندروید — FCM برای پس زمینه + کانال محلی برای فورگراند
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
      // FCM — رجیستر کردن توکن؛ بدون google-services.json خطا می دهد و فقط لاگ می شود
      try {
        await initNativePush();
      } catch (e) {
        console.error("[FCM] init failed (google-services.json missing?):", e);
      }
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

  // اپ اندروید — نوتیفیکیشن بومی در نوار وضعیت (فقط فورگراند؛ بک گراند را FCM هندل می کند)
  try {
    const { Capacitor } = await import("@capacitor/core");
    if (Capacitor.isNativePlatform()) {
      if (document.visibilityState !== "visible") return;
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
