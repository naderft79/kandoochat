"use client";

// قفل حالت عمودی: مرورگر و PWA در صورت پشتیبانی قفل می کنند؛ روی گوشی افقی پیام می دهیم
import { useEffect } from "react";

type LockableOrientation = ScreenOrientation & { lock?: (orientation: string) => Promise<void> };

export default function PortraitGuard() {
  useEffect(() => {
    const orientation = screen.orientation as LockableOrientation | undefined;
    orientation?.lock?.("portrait-primary").catch(() => {});
  }, []);

  return (
    <div className="portrait-guard" role="alert" aria-live="assertive">
      <div className="flex flex-col items-center gap-4 px-8 text-center">
        <div className="w-16 h-16 rounded-2xl bg-neutral-100 flex items-center justify-center">
          <svg viewBox="0 0 24 24" className="w-8 h-8 text-neutral-500" fill="none" stroke="currentColor" strokeWidth={1.8} aria-hidden>
            <rect x="7" y="2" width="10" height="20" rx="2" />
            <path d="M11 18h2" />
          </svg>
        </div>
        <p className="text-base font-black text-foreground">دستگاه خود را بچرخانید</p>
        <p className="text-sm text-ig-gray leading-6">کندو فقط در حالت عمودی کار می کند</p>
      </div>
    </div>
  );
}
