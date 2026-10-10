"use client";

// عکس زنده پنل مدیریت — نمایش تمام عکس های ارسالی در لحظه با SSE
import { useState, useEffect, useRef, useCallback } from "react";
import { Loader2, ArrowUp, Radio, LogIn, Image as ImageIcon, X, Trash2, Download, AlertTriangle, UserCircle } from "lucide-react";
import DefaultAvatar from "@/components/dashboard/DefaultAvatar";
import { toPersianDigits, formatDateTimeCustom } from "@/lib/format";

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

export default function LivePhotosClient() {
  const [messages, setMessages] = useState<LiveMessage[]>([]);
  const [loading, setLoading] = useState(true);
  const [hasMore, setHasMore] = useState(false);
  const [loadingMore, setLoadingMore] = useState(false);
  const [newCount, setNewCount] = useState(0);
  const [connected, setConnected] = useState(false);
  const [impersonatingId, setImpersonatingId] = useState<string | null>(null);
  const [photoModal, setPhotoModal] = useState<LiveMessage | null>(null);
  const [deleting, setDeleting] = useState(false);
  const [warning, setWarning] = useState(false);
  const topRef = useRef<HTMLDivElement>(null);
  const sentinelRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    async function fetchInitial() {
      try {
        const res = await fetch("/api/admin/live-photos?limit=50");
        const data = await res.json();
        setMessages(data.messages);
        setHasMore(data.hasMore);
      } finally {
        setLoading(false);
      }
    }
    fetchInitial();
  }, []);

  useEffect(() => {
    const es = new EventSource("/api/admin/live-photos?stream=true");

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
      const res = await fetch(`/api/admin/live-photos?limit=50&cursor=${encodeURIComponent(lastCreatedAt)}`);
      const data = await res.json();
      setMessages((prev) => [...prev, ...data.messages]);
      setHasMore(data.hasMore);
    } finally {
      setLoadingMore(false);
    }
  }, [hasMore, loadingMore, messages]);

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

  async function deletePhoto(msg: LiveMessage) {
    setDeleting(true);
    try {
      const res = await fetch(`/api/admin/messages/${msg.id}`, { method: "DELETE" });
      if (res.ok) {
        setMessages((prev) => prev.filter((m) => m.id !== msg.id));
        setPhotoModal(null);
      }
    } finally {
      setDeleting(false);
    }
  }

  async function warnUser(msg: LiveMessage) {
    setWarning(true);
    try {
      await fetch("/api/admin/warn", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ userId: msg.sender.id, reason: "ارسال محتوای نامناسب" }),
      });
      setPhotoModal(null);
    } finally {
      setWarning(false);
    }
  }

  // تقسیم به 3 ستون
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
          {toPersianDigits(messages.length)} عکس
        </span>
      </div>

      {/* دکمه بازگشت به بالا */}
      {newCount > 0 && (
        <button
          onClick={scrollToTop}
          className="fixed bottom-20 lg:bottom-8 left-8 z-50 lux-btn-gold px-4 py-2.5 rounded-full text-xs font-bold flex items-center gap-2 transition-all"
        >
          <ArrowUp className="w-4 h-4" />
          {toPersianDigits(newCount)} عکس جدید
        </button>
      )}

      <div ref={topRef} />

      {/* لایوت: موبایل 1 ستون / تبلت 2 ستون / دسکتاپ 3 ستون — مثل چت زنده */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-3 items-start">
        {messages.map((msg) => {
          const receiver =
            msg.conversation.userAId === msg.sender.id
              ? msg.conversation.userB
              : msg.conversation.userA;
          const senderPhoto = msg.sender.photos?.[0]?.url;
          const receiverPhoto = receiver.photos?.[0]?.url;

          return (
            <div
              key={msg.id}
              className="lux-card overflow-hidden ig-fade-in"
            >
              {/* عکس ارسالی — ارتفاع پویا */}
              <div className="relative bg-[#0d0d0d] cursor-pointer flex items-center justify-center" onClick={() => setPhotoModal(msg)}>
                {msg.mediaUrl ? (
                  // eslint-disable-next-line @next/next/no-img-element
                  <img src={msg.mediaUrl} alt="عکس ارسالی" className="w-full h-auto object-contain max-h-[380px]" />
                ) : (
                  <div className="flex items-center justify-center w-full h-full">
                    <ImageIcon className="w-8 h-8 text-[#666]" />
                  </div>
                )}
              </div>

              {/* تاریخ و ساعت */}
              <div className="flex justify-end px-2.5 pt-2">
                <span className="text-[9px] text-[#888] bg-[rgba(212,175,55,0.04)] border border-[rgba(212,175,55,0.08)] px-1.5 py-0.5 rounded" dir="rtl">
                  {formatDateTimeCustom(new Date(msg.createdAt))}
                </span>
              </div>

              {/* فرستنده و گیرنده روبه روی هم — مثل چت زنده */}
              <div className="p-2.5">
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
                        {msg.sender.firstName} {msg.sender.lastName}
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
                        {receiver.firstName} {receiver.lastName}
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
              </div>
            </div>
          );
        })}
      </div>

      {/* sentinel برای auto-load */}
      {hasMore && (
        <div ref={sentinelRef} className="flex justify-center py-6">
          {loadingMore && <Loader2 className="w-5 h-5 text-[#d4af37] animate-spin" />}
        </div>
      )}

      {messages.length === 0 && !loading && (
        <div className="flex flex-col items-center justify-center py-20 text-center">
          <ImageIcon className="w-10 h-10 text-[rgba(212,175,55,0.3)] mb-3" strokeWidth={1.5} />
          <p className="text-sm text-[#666]">هنوز عکسی ارسال نشده است</p>
        </div>
      )}

      {/* مودال تصویر کامل با قابلیت های مدیریتی */}
      {photoModal && (
        <div
          className="fixed inset-0 z-50 bg-black/80 flex items-center justify-center p-4"
          onClick={() => setPhotoModal(null)}
        >
          <div
            className="lux-card max-w-2xl w-full max-h-[90vh] overflow-y-auto"
            onClick={(e) => e.stopPropagation()}
          >
            {/* هدر مودال */}
            <div className="flex items-center justify-between p-3 border-b border-[rgba(212,175,55,0.1)]">
              <span className="text-xs font-bold text-[#e8e8e8]">مدیریت عکس</span>
              <button
                onClick={() => setPhotoModal(null)}
                className="w-7 h-7 rounded-lg hover:bg-[rgba(212,175,55,0.08)] flex items-center justify-center transition-colors"
              >
                <X className="w-4 h-4 text-[#888]" />
              </button>
            </div>

            {/* تصویر کامل */}
            <div className="bg-black flex items-center justify-center">
              {photoModal.mediaUrl && (
                // eslint-disable-next-line @next/next/no-img-element
                <img src={photoModal.mediaUrl} alt="عکس کامل" className="max-w-full max-h-[50vh] object-contain" />
              )}
            </div>

            {/* اطلاعات و قابلیت های مدیریتی */}
            <div className="p-4 space-y-3">
              {/* تاریخ */}
              <div className="flex justify-center">
                <span className="text-[10px] text-[#888] bg-[rgba(212,175,55,0.04)] border border-[rgba(212,175,55,0.08)] px-2.5 py-1 rounded" dir="rtl">
                  {formatDateTimeCustom(new Date(photoModal.createdAt))}
                </span>
              </div>

              {/* فرستنده و گیرنده */}
              <div className="flex items-center justify-between gap-2">
                {/* فرستنده */}
                <div className="flex items-center gap-2 min-w-0">
                  {photoModal.sender.photos?.[0]?.url ? (
                    // eslint-disable-next-line @next/next/no-img-element
                    <img src={photoModal.sender.photos[0].url} alt={photoModal.sender.firstName} className="w-9 h-9 rounded-full object-cover shrink-0" />
                  ) : (
                    <DefaultAvatar size={36} />
                  )}
                  <div className="min-w-0">
                    <p className="text-xs font-bold text-[#e8e8e8] truncate">فرستنده</p>
                    <p className="text-[10px] text-[#888] truncate">{photoModal.sender.firstName} {photoModal.sender.lastName}</p>
                    <p className="text-[9px] text-[#888] truncate" dir="ltr">
                      {photoModal.sender.username ? `@${photoModal.sender.username}` : photoModal.sender.id.slice(0, 8)}
                    </p>
                  </div>
                  <button
                    onClick={() => impersonate(photoModal.sender.id)}
                    disabled={impersonatingId === photoModal.sender.id}
                    className="w-6 h-6 rounded-lg lux-btn-gold flex items-center justify-center shrink-0 disabled:opacity-50"
                    title="ورود به پنل"
                  >
                    {impersonatingId === photoModal.sender.id ? (
                      <Loader2 className="w-3 h-3 animate-spin" />
                    ) : (
                      <LogIn className="w-3 h-3" />
                    )}
                  </button>
                </div>

                {/* گیرنده */}
                {(() => {
                  const r = photoModal.conversation.userAId === photoModal.sender.id
                    ? photoModal.conversation.userB
                    : photoModal.conversation.userA;
                  return (
                    <div className="flex items-center gap-2 min-w-0">
                      <button
                        onClick={() => impersonate(r.id)}
                        disabled={impersonatingId === r.id}
                        className="w-6 h-6 rounded-lg lux-btn-gold flex items-center justify-center shrink-0 disabled:opacity-50"
                        title="ورود به پنل"
                      >
                        {impersonatingId === r.id ? (
                          <Loader2 className="w-3 h-3 animate-spin" />
                        ) : (
                          <LogIn className="w-3 h-3" />
                        )}
                      </button>
                      <div className="min-w-0 text-right">
                        <p className="text-xs font-bold text-[#e8e8e8] truncate">گیرنده</p>
                        <p className="text-[10px] text-[#888] truncate">{r.firstName} {r.lastName}</p>
                        <p className="text-[9px] text-[#888] truncate" dir="ltr">
                          {r.username ? `@${r.username}` : r.id.slice(0, 8)}
                        </p>
                      </div>
                      {r.photos?.[0]?.url ? (
                        // eslint-disable-next-line @next/next/no-img-element
                        <img src={r.photos[0].url} alt={r.firstName} className="w-9 h-9 rounded-full object-cover shrink-0" />
                      ) : (
                        <DefaultAvatar size={36} />
                      )}
                    </div>
                  );
                })()}
              </div>

              {/* دکمه های مدیریتی */}
              <div className="flex gap-2 pt-2 border-t border-[rgba(212,175,55,0.1)]">
                <button
                  onClick={() => deletePhoto(photoModal)}
                  disabled={deleting}
                  className="flex-1 flex items-center justify-center gap-1.5 px-3 py-2 rounded-lg bg-[rgba(239,68,68,0.1)] text-[#f87171] border border-[rgba(239,68,68,0.2)] text-xs font-bold hover:bg-[rgba(239,68,68,0.15)] transition-all disabled:opacity-50"
                >
                  {deleting ? <Loader2 className="w-3.5 h-3.5 animate-spin" /> : <Trash2 className="w-3.5 h-3.5" />}
                  حذف عکس
                </button>
                <button
                  onClick={() => warnUser(photoModal)}
                  disabled={warning}
                  className="flex-1 flex items-center justify-center gap-1.5 px-3 py-2 rounded-lg bg-[rgba(212,175,55,0.1)] text-[#d4af37] border border-[rgba(212,175,55,0.2)] text-xs font-bold hover:bg-[rgba(212,175,55,0.15)] transition-all disabled:opacity-50"
                >
                  {warning ? <Loader2 className="w-3.5 h-3.5 animate-spin" /> : <AlertTriangle className="w-3.5 h-3.5" />}
                  اخطار
                </button>
                <button
                  onClick={() => impersonate(photoModal.sender.id)}
                  disabled={impersonatingId === photoModal.sender.id}
                  className="flex-1 flex items-center justify-center gap-1.5 px-3 py-2 rounded-lg lux-btn-outline text-xs font-bold disabled:opacity-50"
                >
                  <UserCircle className="w-3.5 h-3.5" />
                  ورود به پنل فرستنده
                </button>
                <a
                  href={photoModal.mediaUrl ?? "#"}
                  download
                  className="flex items-center justify-center gap-1.5 px-3 py-2 rounded-lg lux-btn-outline text-xs font-bold"
                >
                  <Download className="w-3.5 h-3.5" />
                  دانلود
                </a>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
