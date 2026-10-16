"use client";

// پاک سازی اشتراک های پوش قدیمی — اعلان ها فقط داخل برنامه هستند (مرکز اعلان + SSE زنده)
// وب پوش و اعلان های سیستمی غیرفعال شده اند تا سایت به خاطر اسپم نوتیفیکیشن پلی نخورد
// بعد از ثبت نام/ورود صدا زده می شود و اگر اشتراک قدیمی وجود داشته باشد لغو می کند

export async function cleanupPushSubscriptions(): Promise<void> {
  if (typeof window === "undefined") return;

  // اپ بومی اصلا اشتراک پوش مرورگر ندارد
  try {
    const { Capacitor } = await import("@capacitor/core");
    if (Capacitor.isNativePlatform()) return;
  } catch {
    // Capacitor در دسترس نیست — ادامه
  }

  if (!("serviceWorker" in navigator) || !("PushManager" in window)) return;
  try {
    const registration = await navigator.serviceWorker.ready;
    const subscription = await registration.pushManager.getSubscription();
    if (!subscription) return;
    await subscription.unsubscribe();
    // حذف اشتراک از سرور تا دوباره برایش ارسال نشود
    await fetch("/api/push/unsubscribe", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ endpoint: subscription.endpoint }),
    });
  } catch (err) {
    console.error("[PWA] push cleanup failed:", err);
  }
}
