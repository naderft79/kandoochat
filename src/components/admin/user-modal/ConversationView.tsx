"use client";

// متن کامل یک گفتگو برای ادمین با صفحه بندی معکوس؛ هر بار باز شدن در لاگ سرور ثبت می شود
import { useState } from "react";
import { ArrowRight, Loader2 } from "lucide-react";
import { formatDateTimeCustom, toPersianDigits } from "@/lib/format";
import type { ChatMessage } from "@/lib/admin-user-data";
import { useJson } from "@/components/admin/user-modal/useJson";

type ConvPage = { messages: ChatMessage[]; nextCursor: string | null };
type Older = { messages: ChatMessage[]; nextCursor: string | null; loaded: boolean };

type Props = {
  userId: string;
  convId: string;
  title: string;
  onBack: () => void;
};

export default function ConversationView({ userId, convId, title, onBack }: Props) {
  const url = `/api/admin/users/${encodeURIComponent(userId)}/conversations/${encodeURIComponent(convId)}`;
  const first = useJson<ConvPage>(url);
  const [older, setOlder] = useState<Older>({ messages: [], nextCursor: null, loaded: false });
  const [loadingMore, setLoadingMore] = useState(false);
  const [moreError, setMoreError] = useState<string | null>(null);

  const cursor = older.loaded ? older.nextCursor : first.data?.nextCursor ?? null;
  // داده ها جدیدترین اول هستند؛ برای نمایش، از قدیمی به جدید مرتب می شوند
  const newestFirst = [...(first.data?.messages ?? []), ...older.messages];
  const chronological = [...newestFirst].reverse();

  async function loadOlder() {
    if (!cursor) return;
    setLoadingMore(true);
    setMoreError(null);
    try {
      const res = await fetch(`${url}?cursor=${encodeURIComponent(cursor)}`, { cache: "no-store" });
      const body = (await res.json().catch(() => ({}))) as Partial<ConvPage> & { error?: string };
      if (!res.ok || !body.messages) {
        setMoreError(body.error ?? "خطا در دریافت پیام های قدیمی تر");
        return;
      }
      setOlder((prev) => ({
        messages: [...prev.messages, ...body.messages!],
        nextCursor: body.nextCursor ?? null,
        loaded: true,
      }));
    } catch {
      setMoreError("خطا در ارتباط با سرور");
    } finally {
      setLoadingMore(false);
    }
  }

  return (
    <div className="space-y-3">
      <div className="flex items-center justify-between gap-2">
        <button type="button" onClick={onBack} className="px-3 py-1.5 rounded-lg lux-btn-outline text-xs font-bold flex items-center gap-1">
          <ArrowRight className="w-3.5 h-3.5" aria-hidden />
          بازگشت به فهرست گفتگوها
        </button>
        <p className="text-xs font-bold text-[#e8e8e8] truncate">گفتگو با {title}</p>
      </div>
      <p className="text-[11px] text-[#d4af37]/80">
        این گفتگو برای ادمین نمایش داده می شود و در لاگ عملیات ثبت شده است.
      </p>

      {first.loading && (
        <div className="flex justify-center py-10">
          <Loader2 className="w-6 h-6 text-[rgba(212,175,55,0.6)] animate-spin" aria-label="در حال بارگذاری" />
        </div>
      )}
      {first.error && <p className="text-xs text-[#f87171] text-center py-6">{first.error}</p>}

      {first.data && (
        <div className="space-y-2">
          {cursor && (
            <div className="flex justify-center">
              <button
                type="button"
                onClick={loadOlder}
                disabled={loadingMore}
                className="px-3 py-1.5 rounded-lg lux-btn-outline text-xs font-bold disabled:opacity-50 flex items-center gap-1.5"
              >
                {loadingMore && <Loader2 className="w-3 h-3 animate-spin" aria-hidden />}
                بارگذاری پیام های قدیمی تر
              </button>
            </div>
          )}
          {moreError && <p className="text-xs text-[#f87171] text-center">{moreError}</p>}
          {chronological.length === 0 && <p className="text-sm text-[#888] text-center py-8">پیامی در این گفتگو نیست</p>}
          <ul className="space-y-2 max-h-[60dvh] overflow-y-auto pr-1">
            {chronological.map((m) => (
              <li key={m.id} className={`flex ${m.mine ? "justify-start" : "justify-end"}`}>
                <div
                  className={`max-w-[85%] md:max-w-[70%] rounded-2xl px-3 py-2 space-y-1 border ${
                    m.mine
                      ? "bg-[rgba(212,175,55,0.1)] border-[rgba(212,175,55,0.25)]"
                      : "bg-[rgba(255,255,255,0.03)] border-[rgba(212,175,55,0.12)]"
                  }`}
                >
                  <p className="text-[10px] text-[#888]">
                    {m.mine ? "کاربر" : "طرف مقابل"} · {formatDateTimeCustom(m.at)} · {typeLabel(m.type)}
                  </p>
                  {m.type === "TEXT" && m.content && <p className="text-sm text-[#e8e8e8] whitespace-pre-wrap break-words">{m.content}</p>}
                  {m.type === "IMAGE" && m.mediaUrl && (
                    <a href={m.mediaUrl} target="_blank" rel="noreferrer" className="block">
                      {/* eslint-disable-next-line @next/next/no-img-element */}
                      <img src={m.mediaUrl} alt="" className="max-h-56 rounded-lg" loading="lazy" />
                    </a>
                  )}
                  {(m.type === "VIDEO" || m.type === "VOICE") && m.mediaUrl && (
                    <video src={m.mediaUrl} controls preload="none" className="max-w-xs rounded-lg" aria-label="رسانه گفتگو" />
                  )}
                  {m.type !== "TEXT" && m.type !== "IMAGE" && m.type !== "VIDEO" && m.type !== "VOICE" && m.content && (
                    <p className="text-sm text-[#e8e8e8] break-words">{m.content}</p>
                  )}
                </div>
              </li>
            ))}
          </ul>
          <p className="text-[10px] text-[#666] text-center">{toPersianDigits(chronological.length)} پیام بارگذاری شده</p>
        </div>
      )}
    </div>
  );
}

function typeLabel(type: string): string {
  switch (type) {
    case "IMAGE": return "عکس";
    case "VIDEO": return "ویدیو";
    case "VOICE": return "صوتی";
    case "STICKER": return "استیکر";
    case "SYSTEM": return "سیستمی";
    default: return "متن";
  }
}
