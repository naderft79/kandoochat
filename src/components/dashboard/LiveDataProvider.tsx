"use client";

// Provider داده های زنده داشبورد — یک اتصال SSE مشترک برای بج ها و موجودی
import { createContext, useContext, useEffect, useRef, useState, type ReactNode } from "react";
import LiveNotifBanner, { type LiveNotif } from "@/components/dashboard/LiveNotifBanner";
import { fireSystemNotification } from "@/lib/pushClient";

// حداقل فاصله بین دو توست — در این بازه اعلان ها فقط روی بج عددی حساب می شوند
const TOAST_COOLDOWN_MS = 20_000;

// پیام زنده که از SSE می آید — برای نوتیف تلگرامی اندروید
type LiveMessage = {
  id: string;
  conversationId: string;
  senderName: string;
  preview: string;
};

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
  // پلتفرم بومی (اندروید) — توست داخل برنامه نشان داده نمی شود
  const isNative = useRef(false);
  // آخرین زمان نمایش توست — محدودیت یک توست در هر ۲۰ ثانیه
  const lastToastAt = useRef(0);
  // پیام هایی که برایشان نوتیف بومی ارسال شده — جلوگیری از تکرار
  const notifiedMsgs = useRef(new Set<string>());

  useEffect(() => {
    void import("@capacitor/core")
      .then(({ Capacitor }) => {
        isNative.current = Capacitor.isNativePlatform();
      })
      .catch(() => {});
  }, []);

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
          // اعلان جدید رسیده
          if (d.notification?.id) {
            // توست داخل برنامه — فقط وب/PWA و حداکثر یکی در هر ۲۰ ثانیه
            const now = Date.now();
            if (!isNative.current && now - lastToastAt.current >= TOAST_COOLDOWN_MS) {
              lastToastAt.current = now;
              setLiveNotif(d.notification);
            }
            // نوتیف سیستمی — اندروید همیشه، وب فقط وقتی تب مخفی است
            void fireSystemNotification(d.notification.title, d.notification.body, "/dashboard/notifications", d.notification.id);
          }
          // پیام جدید — نوتیف تلگرامی فقط روی اندروید (اسم فرستنده + متن پیام)
          const msg = d.message as LiveMessage | undefined;
          if (d.scope === "messages" && msg?.id && isNative.current) {
            const insideChat = window.location.pathname.startsWith(`/dashboard/chat/${msg.conversationId}`);
            if (!insideChat && !notifiedMsgs.current.has(msg.id)) {
              notifiedMsgs.current.add(msg.id);
              if (notifiedMsgs.current.size > 200) notifiedMsgs.current.clear();
              void fireSystemNotification(msg.senderName, msg.preview, `/dashboard/chat/${msg.conversationId}`, `msg-${msg.id}`);
            }
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
