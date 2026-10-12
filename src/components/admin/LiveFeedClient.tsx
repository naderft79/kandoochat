"use client";

// فید زنده عمومی آنالیز لحظه ای — هر ۱۰ ثانیه از API کانال تازه می شود
import { useEffect, useState } from "react";
import { Loader2, Activity } from "lucide-react";
import { toPersianDigits, formatDateTimeCustom } from "@/lib/format";

type FeedItem = {
  id: string;
  title: string;
  subtitle: string;
  value: string;
  tone: "gold" | "green" | "red" | "muted";
  createdAt: string;
};

const POLL_MS = 10_000;

const toneClass: Record<FeedItem["tone"], string> = {
  gold: "text-[#d4af37]",
  green: "text-[#34d399]",
  red: "text-[#f87171]",
  muted: "text-[#888]",
};

export default function LiveFeedClient({ channel, emptyLabel }: { channel: string; emptyLabel: string }) {
  const [items, setItems] = useState<FeedItem[] | null>(null);
  const [error, setError] = useState(false);
  const [updatedAt, setUpdatedAt] = useState<Date | null>(null);

  useEffect(() => {
    let active = true;
    const run = async () => {
      try {
        const res = await fetch(`/api/admin/live/${channel}`, { cache: "no-store" });
        if (!res.ok) throw new Error(String(res.status));
        const data = (await res.json()) as { items: FeedItem[] };
        if (!active) return;
        setItems(data.items);
        setUpdatedAt(new Date());
        setError(false);
      } catch {
        if (active) setError(true);
      }
    };
    void run();
    const timer = setInterval(() => void run(), POLL_MS);
    return () => {
      active = false;
      clearInterval(timer);
    };
  }, [channel]);

  if (items === null && !error) {
    return (
      <div className="flex items-center justify-center py-16">
        <Loader2 className="w-6 h-6 text-[rgba(212,175,55,0.5)] animate-spin" />
      </div>
    );
  }

  return (
    <div className="space-y-3">
      <div className="flex items-center justify-between text-[11px] text-[#666]">
        <span className="flex items-center gap-1.5">
          <span className="relative flex h-2 w-2">
            <span className="absolute inline-flex h-full w-full rounded-full bg-[#34d399] opacity-60 animate-ping" />
            <span className="relative inline-flex h-2 w-2 rounded-full bg-[#34d399]" />
          </span>
          زنده · هر ۱۰ ثانیه
        </span>
        {updatedAt && <span>آخرین به‌روزرسانی {formatDateTimeCustom(updatedAt)}</span>}
      </div>

      {error && <p className="text-xs text-[#f87171]">خطا در دریافت اطلاعات؛ تلاش مجدد خودکار انجام می شود</p>}

      {items && items.length === 0 ? (
        <div className="lux-card p-8 text-center">
          <Activity className="w-6 h-6 text-[rgba(212,175,55,0.4)] mx-auto mb-2" />
          <p className="text-sm text-[#888]">{emptyLabel}</p>
        </div>
      ) : (
        <ul className="space-y-2">
          {items?.map((it) => (
            <li key={it.id} className="lux-card px-4 py-3 flex items-center justify-between gap-3">
              <div className="min-w-0">
                <p className="text-sm font-bold text-[#e8e8e8] truncate">{it.title}</p>
                <p className="text-[11px] text-[#666] truncate">{it.subtitle}</p>
              </div>
              <div className="text-left shrink-0">
                <p className={`text-xs font-bold ${toneClass[it.tone]}`}>{it.value}</p>
                <p className="text-[10px] text-[#666]">{formatDateTimeCustom(new Date(it.createdAt))}</p>
              </div>
            </li>
          ))}
        </ul>
      )}
      {items && <p className="text-[10px] text-[#555] text-center">{toPersianDigits(items.length)} رویداد اخیر</p>}
    </div>
  );
}
