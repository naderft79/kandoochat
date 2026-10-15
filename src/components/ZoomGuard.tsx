"use client";

// جلوگیری کامل از زوم کاربر — پینچ و دابل تپ، در iOS و اندروید
// iOS تگ viewport را نادیده می گیرد؛ gesture و multi-touch باید با JS بلاک شوند
import { useEffect } from "react";

export default function ZoomGuard() {
  useEffect(() => {
    // رویدادهای gesture سافاری iOS (پینچ زوم)
    const prevent = (e: Event) => e.preventDefault();
    // پینچ با دو انگشت در مرورگرهایی که gesture نمی فرستند
    const preventMultiTouch = (e: TouchEvent) => {
      if (e.touches.length > 1) e.preventDefault();
    };
    // دابل تپ زوم
    const preventDblClick = (e: MouseEvent) => e.preventDefault();

    document.addEventListener("gesturestart", prevent);
    document.addEventListener("gesturechange", prevent);
    document.addEventListener("gestureend", prevent);
    document.addEventListener("touchmove", preventMultiTouch, { passive: false });
    document.addEventListener("dblclick", preventDblClick);

    return () => {
      document.removeEventListener("gesturestart", prevent);
      document.removeEventListener("gesturechange", prevent);
      document.removeEventListener("gestureend", prevent);
      document.removeEventListener("touchmove", preventMultiTouch);
      document.removeEventListener("dblclick", preventDblClick);
    };
  }, []);

  return null;
}
