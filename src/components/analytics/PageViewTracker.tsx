"use client";

// ثبت بازدید صفحات در کلاینت: هر تغییر مسیر یک بازدید؛ اولین صفحه هر تب مرورگر «ورودی» است (ارجاع و utm فقط برای ورودی)
import { useEffect } from "react";
import { usePathname } from "next/navigation";

const STARTED_KEY = "kandoo_visit_started";
const ENDPOINT = "/api/analytics/pageview";
let lastSent: { path: string; at: number } | null = null;

export default function PageViewTracker() {
  const pathname = usePathname();

  useEffect(() => {
    if (!pathname || pathname.startsWith("/admin") || pathname.startsWith("/api")) return;
    // جلوگیری از ارسال دوباره در اجرای مجدد effect (StrictMode) یا تکرار همان مسیر در یک ثانیه
    const now = Date.now();
    if (lastSent && lastSent.path === pathname && now - lastSent.at < 1000) return;
    lastSent = { path: pathname, at: now };

    let entry = false;
    try {
      if (!sessionStorage.getItem(STARTED_KEY)) {
        sessionStorage.setItem(STARTED_KEY, "1");
        entry = true;
      }
    } catch {
      // حالت خصوصی مرورگر: sessionStorage در دسترس نیست؛ بازدید بدون علامت ورودی ثبت می شود
    }

    const params = new URLSearchParams(window.location.search);
    const payload = JSON.stringify({
      path: pathname,
      entry,
      referrer: entry && document.referrer ? document.referrer : null,
      utmSource: entry ? params.get("utm_source") : null,
      utmMedium: entry ? params.get("utm_medium") : null,
    });

    if (navigator.sendBeacon) {
      navigator.sendBeacon(ENDPOINT, new Blob([payload], { type: "application/json" }));
    } else {
      void fetch(ENDPOINT, { method: "POST", headers: { "Content-Type": "application/json" }, body: payload, keepalive: true }).catch(() => {});
    }
  }, [pathname]);

  return null;
}
