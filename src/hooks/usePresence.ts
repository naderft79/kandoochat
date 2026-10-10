"use client";

// hook به روزرسانی حضور آنلاین کاربر
import { useEffect } from "react";

export function usePresence() {
  useEffect(() => {
    // به روزرسانی اولیه — آنلاین
    fetch("/api/me/presence", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ isOnline: true }),
    }).catch(() => {});

    // هر ۶۰ ثانیه به روزرسانی
    const interval = setInterval(() => {
      fetch("/api/me/presence", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ isOnline: true }),
      }).catch(() => {});
    }, 60000);

    // هنگام مخفی شدن صفحه — آفلاین
    const handleVisibilityChange = () => {
      const isOnline = document.visibilityState === "visible";
      fetch("/api/me/presence", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ isOnline }),
      }).catch(() => {});
    };

    // هنگام بستن صفحه — آفلاین
    const handleBeforeUnload = () => {
      // sendBeacon برای ارسال مطمئن هنگام unload
      if (navigator.sendBeacon) {
        const blob = new Blob(
          [JSON.stringify({ isOnline: false })],
          { type: "application/json" }
        );
        navigator.sendBeacon("/api/me/presence", blob);
      } else {
        fetch("/api/me/presence", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ isOnline: false }),
          keepalive: true,
        }).catch(() => {});
      }
    };

    document.addEventListener("visibilitychange", handleVisibilityChange);
    window.addEventListener("beforeunload", handleBeforeUnload);

    return () => {
      clearInterval(interval);
      document.removeEventListener("visibilitychange", handleVisibilityChange);
      window.removeEventListener("beforeunload", handleBeforeUnload);
      // هنگام unmount — آفلاین
      fetch("/api/me/presence", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ isOnline: false }),
        keepalive: true,
      }).catch(() => {});
    };
  }, []);
}
