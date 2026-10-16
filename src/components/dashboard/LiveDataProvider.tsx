"use client";

// Provider داده های زنده داشبورد — یک اتصال SSE مشترک برای بج ها و موجودی
import { createContext, useContext, useEffect, useRef, useState, type ReactNode } from "react";
import LiveNotifBanner, { type LiveToast } from "@/components/dashboard/LiveNotifBanner";

import { getNotifHref } from "@/components/dashboard/notifConfig";

// حداقل فاصله بین دو توست اعلان — در این بازه اعلان ها فقط روی بج عددی حساب می شوند
const TOAST_COOLDOWN_MS = 20_000;
// فاصله کوتاه تر برای توست پیام جدید — پیام ها مهم ترند ولی اسپم نشوند
const MSG_TOAST_COOLDOWN_MS = 8_000;

// پیام زنده که از SSE می آید — برای توست پیام جدید و نوتیف پس زمینه
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
  const [liveToast, setLiveToast] = useState<LiveToast | null>(null);
  // آخرین زمان نمایش توست — محدودیت اسپم
  const lastToastAt = useRef(0);
  const lastMsgToastAt = useRef(0);
  // پیام هایی که برایشان نوتیف ارسال شده — جلوگیری از تکرار
  const notifiedMsgs = useRef(new Set<string>());

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
            // توست داخل برنامه — همه پلتفرم ها، حداکثر یکی در هر ۲۰ ثانیه
            const now = Date.now();
            if (now - lastToastAt.current >= TOAST_COOLDOWN_MS) {
              lastToastAt.current = now;
              const n = d.notification as { id: string; type: string; title: string; data: string | null };
              setLiveToast({
                id: n.id,
                iconKey: n.type,
                text: n.title,
                label: "مشاهده",
                href: getNotifHref(n.type, n.data),
              });
            }
          }
          // پیام جدید — توست داخلی «شما پیام جدیدی دارید»
          const msg = d.message as LiveMessage | undefined;
          if (d.scope === "messages" && msg?.id) {
            const chatUrl = `/dashboard/chat/${msg.conversationId}`;
            const insideChat = window.location.pathname.startsWith(chatUrl);
            if (!insideChat && !notifiedMsgs.current.has(msg.id)) {
              notifiedMsgs.current.add(msg.id);
              if (notifiedMsgs.current.size > 200) notifiedMsgs.current.clear();
              const now = Date.now();
              if (now - lastMsgToastAt.current >= MSG_TOAST_COOLDOWN_MS) {
                lastMsgToastAt.current = now;
                setLiveToast({
                  id: `msg-${msg.id}`,
                  iconKey: "MESSAGE",
                  text: "شما پیام جدیدی دارید",
                  label: "مشاهده پیام",
                  href: chatUrl,
                });
              }
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
      <LiveNotifBanner toast={liveToast} onClose={() => setLiveToast(null)} />
    </LiveDataContext.Provider>
  );
}
