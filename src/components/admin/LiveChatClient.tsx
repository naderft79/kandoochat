"use client";

// چت زنده پنل مدیریت — نمایش تمام پیام ها در لحظه با SSE
import { useState, useEffect, useRef, useCallback } from "react";
import { MessageCircle, Loader2, ArrowUp, Radio, LogIn } from "lucide-react";
import DefaultAvatar from "@/components/dashboard/DefaultAvatar";
import { toPersianDigits, formatDateTimeCustom } from "@/lib/format";
import UserLink from "@/components/admin/user-modal/UserLink";

type LiveMessage = {
  id: string;
  content: string;
  type: string;
  mediaUrl: string | null;
  duration: number | null;
  createdAt: string;
  sender: {
    id: string;
    firstName: string;
    lastName: string;
    username: string | null;
    gender: string;
    photos: { url: string }[];
  };
  conversation: {
    id: string;
    userAId: string;
    userBId: string;
    userA: {
      id: string;
      firstName: string;
      lastName: string;
      username: string | null;
      photos: { url: string }[];
    };
    userB: {
      id: string;
      firstName: string;
      lastName: string;
      username: string | null;
      photos: { url: string }[];
    };
  };
};

export default function LiveChatClient() {
  const [messages, setMessages] = useState<LiveMessage[]>([]);
  const [loading, setLoading] = useState(true);
  const [hasMore, setHasMore] = useState(false);
  const [loadingMore, setLoadingMore] = useState(false);
  const [newCount, setNewCount] = useState(0);
  const [connected, setConnected] = useState(false);
  const [impersonatingId, setImpersonatingId] = useState<string | null>(null);
  const eventSourceRef = useRef<EventSource | null>(null);
  const topRef = useRef<HTMLDivElement>(null);
  const sentinelRef = useRef<HTMLDivElement>(null);

  // دریافت پیام های اولیه
  useEffect(() => {
    async function fetchInitial() {
      try {
        const res = await fetch("/api/admin/live-chat?limit=50");
        const data = await res.json();
        setMessages(data.messages);
        setHasMore(data.hasMore);
      } finally {
        setLoading(false);
      }
    }
    fetchInitial();
  }, []);

  // اتصال SSE برای real-time
  useEffect(() => {
    const es = new EventSource("/api/admin/live-chat?stream=true");
    eventSourceRef.current = es;

    es.onopen = () => setConnected(true);
    es.onerror = () => setConnected(false);

    es.onmessage = (event) => {
      try {
        const msg: LiveMessage = JSON.parse(event.data);
        setMessages((prev) => [msg, ...prev]);
        setNewCount((c) => c + 1);
      } catch {
        // parse error
      }
    };

    return () => {
      es.close();
      setConnected(false);
    };
  }, []);

  const loadMore = useCallback(async () => {
    if (!hasMore || loadingMore) return;
    setLoadingMore(true);
    try {
      const lastCreatedAt = messages[messages.length - 1]?.createdAt;
      const res = await fetch(`/api/admin/live-chat?limit=50&cursor=${encodeURIComponent(lastCreatedAt)}`);
      const data = await res.json();
      setMessages((prev) => [...prev, ...data.messages]);
      setHasMore(data.hasMore);
    } finally {
      setLoadingMore(false);
    }
  }, [hasMore, loadingMore, messages]);

  // auto-load وقتی اسکرول به پایین می رسد
  useEffect(() => {
    const sentinel = sentinelRef.current;
    if (!sentinel) return;

    const observer = new IntersectionObserver(
      (entries) => {
        if (entries[0]?.isIntersecting && hasMore && !loadingMore) {
          loadMore();
        }
      },
      { rootMargin: "200px" }
    );
    observer.observe(sentinel);
    return () => observer.disconnect();
  }, [hasMore, loadingMore, loadMore]);

  function scrollToTop() {
    topRef.current?.scrollIntoView({ behavior: "smooth" });
    setNewCount(0);
  }

  async function impersonate(userId: string) {
    setImpersonatingId(userId);
    try {
      const res = await fetch("/api/admin/impersonate", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ userId }),
      });
      if (res.ok) {
        const data = await res.json();
        window.location.href = data.redirect;
      }
    } finally {
      setImpersonatingId(null);
    }
  }

  // تقسیم پیام ها به 3 ستون برای دسکتاپ
  const columns: LiveMessage[][] = [[], [], []];
  messages.forEach((msg, i) => {
    columns[i % 3].push(msg);
  });

  if (loading) {
    return (
      <div className="flex items-center justify-center py-20">
        <Loader2 className="w-6 h-6 text-[#d4af37] animate-spin" />
      </div>
    );
  }

  return (
    <div className="relative">
      {/* نوار وضعیت اتصال */}
      <div className="flex items-center justify-between mb-3 px-1">
        <div className="flex items-center gap-1.5">
          <Radio className={`w-3.5 h-3.5 ${connected ? "text-[#34d399]" : "text-[#888]"}`} />
          <span className={`text-[10px] font-bold ${connected ? "text-[#34d399]" : "text-[#888]"}`}>
            {connected ? "متصل — زنده" : "در حال اتصال..."}
          </span>
        </div>
        <span className="text-[10px] text-[#888]">
          {toPersianDigits(messages.length)} پیام
        </span>
      </div>

      {/* دکمه بازگشت به بالا */}
      {newCount > 0 && (
        <button
          onClick={scrollToTop}
          className="fixed bottom-20 lg:bottom-8 left-8 z-50 lux-btn-gold px-4 py-2.5 rounded-full text-xs font-bold flex items-center gap-2 transition-all"
        >
          <ArrowUp className="w-4 h-4" />
          {toPersianDigits(newCount)} پیام جدید
        </button>
      )}

      <div ref={topRef} />

      {/* لایوت موبایل: تک ستونه / دسکتاپ: سه ستونه */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-3">
        {columns.map((col, colIdx) => (
          <div key={colIdx} className="space-y-3">
            {col.map((msg) => {
              const receiver =
                msg.conversation.userAId === msg.sender.id
                  ? msg.conversation.userB
                  : msg.conversation.userA;
              const senderPhoto = msg.sender.photos?.[0]?.url;
              const receiverPhoto = receiver.photos?.[0]?.url;

              return (
                <div
                  key={msg.id}
                  className="lux-card p-2.5 ig-fade-in"
                >
                  {/* تاریخ و ساعت — گوشه بالا سمت راست */}
                  <div className="flex justify-end mb-1.5">
                    <span className="text-[9px] text-[#888] bg-[rgba(212,175,55,0.04)] border border-[rgba(212,175,55,0.08)] px-1.5 py-0.5 rounded" dir="rtl">
                      {formatDateTimeCustom(new Date(msg.createdAt))}
                    </span>
                  </div>

                  {/* فرستنده و گیرنده روبه روی هم */}
                  <div className="flex items-center justify-between gap-1">
                    {/* فرستنده */}
                    <div className="flex items-center gap-1.5 min-w-0">
                      {senderPhoto ? (
                        // eslint-disable-next-line @next/next/no-img-element
                        <img src={senderPhoto} alt={msg.sender.firstName} className="w-7 h-7 rounded-full object-cover shrink-0" />
                      ) : (
                        <DefaultAvatar size={28} />
                      )}
                      <div className="min-w-0">
                        <p className="text-[11px] font-bold text-[#e8e8e8] truncate leading-tight">
                          <UserLink userId={msg.sender.id}>{msg.sender.firstName} {msg.sender.lastName}</UserLink>
                        </p>
                        <p className="text-[9px] text-[#888] truncate leading-tight" dir="ltr">
                          {msg.sender.username ? `@${msg.sender.username}` : msg.sender.id.slice(0, 8)}
                        </p>
                      </div>
                      <button
                        onClick={() => impersonate(msg.sender.id)}
                        disabled={impersonatingId === msg.sender.id}
                        className="w-5 h-5 rounded-md lux-btn-gold flex items-center justify-center shrink-0 disabled:opacity-50"
                        title="ورود به پنل"
                      >
                        {impersonatingId === msg.sender.id ? (
                          <Loader2 className="w-2.5 h-2.5 animate-spin" />
                        ) : (
                          <LogIn className="w-2.5 h-2.5" />
                        )}
                      </button>
                    </div>

                    {/* فلش وسط */}
                    <div className="flex flex-col items-center shrink-0 px-1">
                      <span className="text-[8px] text-[#888] leading-none mb-0.5">به</span>
                      <span className="text-[#888] text-xs leading-none">←</span>
                    </div>

                    {/* گیرنده */}
                    <div className="flex items-center gap-1.5 min-w-0">
                      <button
                        onClick={() => impersonate(receiver.id)}
                        disabled={impersonatingId === receiver.id}
                        className="w-5 h-5 rounded-md lux-btn-gold flex items-center justify-center shrink-0 disabled:opacity-50"
                        title="ورود به پنل"
                      >
                        {impersonatingId === receiver.id ? (
                          <Loader2 className="w-2.5 h-2.5 animate-spin" />
                        ) : (
                          <LogIn className="w-2.5 h-2.5" />
                        )}
                      </button>
                      <div className="min-w-0 text-right">
                        <p className="text-[11px] font-bold text-[#e8e8e8] truncate leading-tight">
                          <UserLink userId={receiver.id}>{receiver.firstName} {receiver.lastName}</UserLink>
                        </p>
                        <p className="text-[9px] text-[#888] truncate leading-tight" dir="ltr">
                          {receiver.username ? `@${receiver.username}` : receiver.id.slice(0, 8)}
                        </p>
                      </div>
                      {receiverPhoto ? (
                        // eslint-disable-next-line @next/next/no-img-element
                        <img src={receiverPhoto} alt={receiver.firstName} className="w-7 h-7 rounded-full object-cover shrink-0" />
                      ) : (
                        <DefaultAvatar size={28} />
                      )}
                    </div>
                  </div>

                  {/* محتوای پیام */}
                  <div className="mt-1.5 pt-1.5 border-t border-[rgba(212,175,55,0.08)]">
                    {msg.type === "TEXT" && (
                      <p className="text-xs text-[#e8e8e8] leading-4 break-words">
                        {msg.content}
                      </p>
                    )}
                    {msg.type === "IMAGE" && msg.mediaUrl && (
                      // eslint-disable-next-line @next/next/no-img-element
                      <img src={msg.mediaUrl} alt="عکس" className="w-full rounded-lg max-h-40 object-cover" />
                    )}
                    {msg.type === "VOICE" && (
                      <div className="flex items-center gap-1.5 bg-[rgba(212,175,55,0.04)] border border-[rgba(212,175,55,0.08)] rounded-lg p-1.5">
                        <MessageCircle className="w-3 h-3 text-[#888]" />
                        <span className="text-[10px] text-[#888]">پیام صوتی</span>
                        {msg.duration && (
                          <span className="text-[9px] text-[#888]">{toPersianDigits(msg.duration)} ثانیه</span>
                        )}
                      </div>
                    )}
                    {msg.type === "VIDEO" && (
                      <div className="flex items-center gap-1.5 bg-[rgba(212,175,55,0.04)] border border-[rgba(212,175,55,0.08)] rounded-lg p-1.5">
                        <MessageCircle className="w-3 h-3 text-[#888]" />
                        <span className="text-[10px] text-[#888]">ویدیو</span>
                      </div>
                    )}
                    {msg.type === "STICKER" && msg.mediaUrl && (
                      // eslint-disable-next-line @next/next/no-img-element
                      <img src={msg.mediaUrl} alt="استیکر" className="w-16 h-16 object-contain" />
                    )}
                  </div>
                </div>
              );
            })}
          </div>
        ))}
      </div>

      {/* sentinel برای auto-load روی اسکرول */}
      {hasMore && (
        <div ref={sentinelRef} className="flex justify-center py-6">
          {loadingMore && <Loader2 className="w-5 h-5 text-[#d4af37] animate-spin" />}
        </div>
      )}

      {messages.length === 0 && !loading && (
        <div className="flex flex-col items-center justify-center py-20 text-center">
          <MessageCircle className="w-10 h-10 text-[rgba(212,175,55,0.3)] mb-3" strokeWidth={1.5} />
          <p className="text-sm text-[#666]">هنوز پیامی وجود ندارد</p>
        </div>
      )}
    </div>
  );
}
