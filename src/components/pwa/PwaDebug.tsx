"use client";

// بررسی وضعیت PWA — آیا در حالت standalone اجرا شده؟
import { useEffect, useState } from "react";

export default function PwaDebug() {
  const [info, setInfo] = useState<Record<string, string>>(() => {
    if (typeof window === "undefined") return {} as Record<string, string>;
    const standalone =
      window.matchMedia("(display-mode: standalone)").matches ||
      (window.navigator as unknown as { standalone?: boolean }).standalone === true;
    const result: Record<string, string> = {
      "display-mode: standalone": standalone ? "YES" : "NO",
      "navigator.standalone": String((window.navigator as unknown as { standalone?: boolean }).standalone ?? "N/A"),
      "serviceWorker": "serviceWorker" in navigator ? "YES" : "NO",
      "SW registered": "unknown",
      protocol: window.location.protocol,
      host: window.location.host,
      hostname: window.location.hostname,
      userAgent: navigator.userAgent.substring(0, 80),
    };
    return result;
  });

  useEffect(() => {
    if ("serviceWorker" in navigator) {
      navigator.serviceWorker.getRegistration().then((reg) => {
        setInfo((prev) => ({ ...prev, "SW registered": reg ? "YES" : "NO" }));
      });
    }
  }, []);

  return (
    <div className="p-4 space-y-2 text-xs font-mono" dir="ltr">
      <h2 className="font-bold text-sm mb-2">PWA Debug Info</h2>
      {Object.entries(info).map(([k, v]) => (
        <div key={k} className="flex justify-between gap-4 border-b border-neutral-100 py-1">
          <span className="text-ig-gray">{k}</span>
          <span className={`font-bold ${v === "YES" ? "text-green-600" : v === "NO" ? "text-red-500" : "text-foreground"}`}>
            {v}
          </span>
        </div>
      ))}
    </div>
  );
}
