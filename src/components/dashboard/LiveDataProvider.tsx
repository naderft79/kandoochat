"use client";

// Provider داده های زنده داشبورد — یک اتصال SSE مشترک برای بج ها و موجودی
import { createContext, useContext, useEffect, useState, type ReactNode } from "react";
import LiveNotifBanner, { type LiveNotif } from "@/components/dashboard/LiveNotifBanner";
import { fireSystemNotification } from "@/lib/pushClient";

type LiveData = {
  unreadCount: number;
  unreadConversations: number;
  balance: number | null;
  refresh: () => void;
};

const LiveDataContext = createContext<LiveData>({
  unreadCount: 0,
  unreadConversations: 0,
  balance: null,
  refresh: () => {},
});

export function useLiveData() {
  return useContext(LiveDataContext);
}

export default function LiveDataProvider({ children, enabled = true }: { children: ReactNode; enabled?: boolean }) {
  const [unreadCount, setUnreadCount] = useState(0);
  const [unreadConversations, setUnreadConversations] = useState(0);
  const [balance, setBalance] = useState<number | null>(null);
  // آخرین اعلان رسیده از SSE — برای نمایش بنر زنده
  const [liveNotif, setLiveNotif] = useState<LiveNotif | null>(null);

  async function fetchCounts() {
    try {
      const res = await fetch("/api/notifications");
      const data = await res.json();
      if (data.unreadCount !== undefined) setUnreadCount(data.unreadCount);
      if (data.unreadConversations !== undefined) setUnreadConversations(data.unreadConversations);
    } catch {
      // خطای شبکه
    }
  }

  useEffect(() => {
    // کاربر وارد نشده — هیچ درخواستی نزن
    if (!enabled) return;
    let es: EventSource | null = null;
    let cancelled = false;

    // بارگذاری اولیه شمارنده ها و موجودی — نتیجه پس از unmount نادیده گرفته می شود
    void (async () => {
      try {
        const [countsRes, balanceRes] = await Promise.all([
          fetch("/api/notifications"),
          fetch("/api/wallet/balance"),
        ]);
        const counts = await countsRes.json();
        const balanceData = await balanceRes.json();
        if (cancelled) return;
        if (counts.unreadCount !== undefined) setUnreadCount(counts.unreadCount);
        if (counts.unreadConversations !== undefined) setUnreadConversations(counts.unreadConversations);
        if (balanceData.balance !== undefined) setBalance(balanceData.balance);
      } catch {
        // خطای شبکه
      }
    })();

    if (typeof EventSource !== "undefined") {
      es = new EventSource("/api/notifications/stream");
      es.addEventListener("snapshot", (e) => {
        try {
          const d = JSON.parse((e as MessageEvent).data);
          if (d.unreadCount !== undefined) setUnreadCount(d.unreadCount);
          if (d.unreadConversations !== undefined) setUnreadConversations(d.unreadConversations);
        } catch {}
      });
      es.addEventListener("change", (e) => {
        try {
          const d = JSON.parse((e as MessageEvent).data);
          if (d.balance !== undefined) setBalance(d.balance);
          if (d.unreadCount !== undefined) setUnreadCount(d.unreadCount);
          if (d.unreadConversations !== undefined) setUnreadConversations(d.unreadConversations);
          // اعلان جدید رسیده — بنر زنده + اعلان سیستمی گوشی
          if (d.notification?.id) {
            setLiveNotif(d.notification);
            void fireSystemNotification(d.notification.title, d.notification.body, "/dashboard/notifications", d.notification.id);
          }
        } catch {}
      });
    }

    // تور ایمنی: اگر SSE قطع شد، هر ۲ دقیقه تازه سازی
    const interval = setInterval(() => {
      if (!cancelled) fetchCounts();
    }, 120_000);

    return () => {
      cancelled = true;
      es?.close();
      clearInterval(interval);
    };
  }, [enabled]);

  return (
    <LiveDataContext.Provider
      value={{
        unreadCount,
        unreadConversations,
        balance,
        refresh: () => void fetchCounts(),
      }}
    >
      {children}
      <LiveNotifBanner notif={liveNotif} onClose={() => setLiveNotif(null)} />
    </LiveDataContext.Provider>
  );
}
