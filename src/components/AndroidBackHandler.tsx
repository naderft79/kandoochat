"use client";

// هندل دکمه بک اندروید — فقط داخل اپ Capacitor فعال است
// در صفحات اصلی اپ را به پس زمینه می برد، در بقیه صفحات به عقب برمی گردد
import { useEffect } from "react";
import { useRouter } from "next/navigation";
import { Capacitor } from "@capacitor/core";
import { App } from "@capacitor/app";

// مسیرهایی که بک در آن ها اپ را مینیمایز می کند
const ROOT_PATHS = ["/", "/dashboard", "/onboarding", "/login"];

export default function AndroidBackHandler() {
  const router = useRouter();

  useEffect(() => {
    if (!Capacitor.isNativePlatform()) return;

    const listener = App.addListener("backButton", () => {
      if (ROOT_PATHS.includes(window.location.pathname)) {
        App.minimizeApp();
      } else {
        router.back();
      }
    });

    return () => {
      listener.then((l) => l.remove());
    };
  }, [router]);

  return null;
}
