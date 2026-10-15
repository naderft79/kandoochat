"use client";

// استور سراسری وضعیت آنلاین کاربران — فقط یک اتصال SSE برای همه مصرف کننده ها
import { useEffect, useState } from "react";

export type LivePresence = { isOnline: boolean; lastSeen: string | null };

type Listener = (data: { userId: string; isOnline: boolean; lastSeen?: string | null }) => void;

const listeners = new Set<Listener>();
let es: EventSource | null = null;

function ensureStream() {
  if (es || typeof window === "undefined") return;
  es = new EventSource("/api/presence/stream");
  es.addEventListener("presence", (event) => {
    try {
      const d = JSON.parse((event as MessageEvent).data);
      for (const l of listeners) l(d);
    } catch {
      // داده نامعتبر
    }
  });
}

function closeStreamIfIdle() {
  if (listeners.size === 0 && es) {
    es.close();
    es = null;
  }
}

// وضعیت زنده آنلاین بودن یک کاربر — مقدار اولیه از رندر سرور می آید
export function useLivePresence(
  userId: string,
  initialIsOnline: boolean,
  initialLastSeen: string | null
): LivePresence {
  const [info, setInfo] = useState<LivePresence>({
    isOnline: initialIsOnline,
    lastSeen: initialLastSeen,
  });

  useEffect(() => {
    ensureStream();
    const listener: Listener = (d) => {
      if (d.userId !== userId) return;
      setInfo((prev) => ({
        isOnline: d.isOnline,
        lastSeen: d.lastSeen ?? prev.lastSeen,
      }));
    };
    listeners.add(listener);
    return () => {
      listeners.delete(listener);
      closeStreamIfIdle();
    };
  }, [userId]);

  return info;
}
