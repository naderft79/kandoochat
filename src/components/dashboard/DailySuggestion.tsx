"use client";

// پیشنهاد روزانه هوشمند — کارت مدرن با glassmorphism و گرادیان
import { useEffect, useRef, useState } from "react";
import Link from "next/link";
import Image from "next/image";
import { Skeleton } from "@/components/dashboard/Skeleton";
import { Sparkles, MapPin, MessageCircle, Crown, Clock } from "lucide-react";
import VerifiedBadge from "@/components/dashboard/VerifiedBadge";
import DefaultAvatar from "@/components/dashboard/DefaultAvatar";
import { toPersianDigits } from "@/lib/format";
import { useRouter } from "next/navigation";

type Suggestion = {
  id: string;
  firstName: string;
  username: string;
  age: number;
  city: string;
  height: number;
  job: string | null;
  bio: string | null;
  isVerified: boolean;
  isOnline: boolean;
  score: number;
  photos: { url: string; order: number }[];
} | null;

export default function DailySuggestion({ city, province }: { city?: string; province?: string }) {
  const router = useRouter();
  const [suggestion, setSuggestion] = useState<Suggestion>(null);
  const [loading, setLoading] = useState(true);
  const [chatLoading, setChatLoading] = useState(false);
  const [needSub, setNeedSub] = useState(false);
  const [timeLeft, setTimeLeft] = useState({ h: 0, m: 0, s: 0 });
  // فقط پاسخ آخرین درخواست اعمال می شود
  const requestSeq = useRef(0);

  // پیشنهاد امروز بر اساس شهر انتخاب شده در فیلتر — با تغییر شهر دوباره گرفته می شود
  useEffect(() => {
    const seq = ++requestSeq.current;
    const params = new URLSearchParams({ sort: "ACTIVE" });
    if (city) params.set("city", city);
    if (province) params.set("province", province);
    fetch(`/api/matches?${params}`)
      .then((r) => r.json())
      .then((data) => {
        if (seq !== requestSeq.current) return;
        setSuggestion(data.matches?.length > 0 ? data.matches[0] : null);
        setNeedSub(false);
      })
      .catch(() => {})
      .finally(() => {
        if (seq === requestSeq.current) setLoading(false);
      });
  }, [city, province]);

  // تایمر شمارش معکوس — هر 6 ساعت یک پیشنهاد جدید
  useEffect(() => {
    const NEXT_HOURS = 6;
    const interval = setInterval(() => {
      const now = new Date();
      const nextTime = new Date(now);
      nextTime.setHours(Math.ceil(now.getHours() / NEXT_HOURS) * NEXT_HOURS, 0, 0, 0);
      if (nextTime <= now) nextTime.setTime(nextTime.getTime() + NEXT_HOURS * 3600000);
      const diff = nextTime.getTime() - now.getTime();
      setTimeLeft({
        h: Math.floor(diff / 3600000),
        m: Math.floor((diff % 3600000) / 60000),
        s: Math.floor((diff % 60000) / 1000),
      });
    }, 1000);
    return () => clearInterval(interval);
  }, []);

  async function startChat() {
    if (!suggestion) return;
    setChatLoading(true);
    try {
      const res = await fetch("/api/conversations", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ targetUserId: suggestion.id }),
      });
      const data = await res.json();
      if (res.status === 402) {
        setNeedSub(true);
        return;
      }
      if (res.ok && data.conversationId) {
        router.push(`/dashboard/chat/${data.conversationId}`);
      }
    } finally {
      setChatLoading(false);
    }
  }

  if (loading) {
    return (
      <div className="rounded-3xl bg-white border border-ig-border p-5 ig-shadow-sm">
        <div className="flex items-center gap-2 mb-4">
          <Skeleton className="w-5 h-5 rounded-full" />
          <Skeleton className="h-3 w-28" />
        </div>
        <div className="flex items-center gap-4">
          <Skeleton className="w-16 h-16 rounded-2xl" />
          <div className="flex-1 space-y-2">
            <Skeleton className="h-3 w-32" />
            <Skeleton className="h-2.5 w-24" />
          </div>
        </div>
      </div>
    );
  }

  if (!suggestion) return null;

  return (
    <div className="relative overflow-hidden rounded-2xl bg-ig-border p-px ig-shadow-md">
      <div className="rounded-2xl bg-white/95 backdrop-blur-xl px-3.5 py-3">
        {/* هدر کارت */}
        <div className="flex items-center justify-between mb-2.5">
          <div className="flex items-center gap-1.5">
            <div className="w-6 h-6 rounded-lg bg-ig-gray-bg flex items-center justify-center">
              <Sparkles className="w-3.5 h-3.5 text-ig-gold" fill="currentColor" />
            </div>
            <span className="text-xs font-black text-neutral-800">
              پیشنهاد امروز
            </span>
          </div>
          <div className="flex items-center gap-1 px-2.5 py-1 rounded-full bg-neutral-100 border border-neutral-200">
            <Clock className="w-3 h-3 text-neutral-600" />
            <span className="text-xs font-bold text-neutral-600">
              تا پیشنهاد بعدی
            </span>
            <span className="text-xs font-bold text-neutral-600 tabular-nums">
              {toPersianDigits(timeLeft.h)}:{toPersianDigits(timeLeft.m).padStart(2, "۰")}:{toPersianDigits(timeLeft.s).padStart(2, "۰")}
            </span>
          </div>
        </div>

        {/* محتوای کارت */}
        <div className="flex items-center gap-3">
          {/* آواتار */}
          <Link href={`/profile/${suggestion.username}`} className="shrink-0 group">
            <div className="relative">
              <div className="w-12 h-12 rounded-xl ig-shadow-sm group-hover:scale-105 transition-transform overflow-hidden flex items-center justify-center">
                {suggestion.photos?.[0]?.url ? (
                  <div className="relative w-full h-full">
                    <Image src={suggestion.photos[0].url} alt={suggestion.firstName} fill className="object-cover" sizes="48px" />
                  </div>
                ) : (
                  <DefaultAvatar size={48} className="rounded-xl" />
                )}
              </div>
              {suggestion.isOnline && (
                <span className="absolute -bottom-0.5 -right-0.5 w-3 h-3 bg-ig-online rounded-full border-2 border-white ig-pulse" />
              )}
            </div>
          </Link>

          {/* اطلاعات */}
          <div className="flex-1 min-w-0">
            <Link href={`/profile/${suggestion.username}`}>
              <p className="text-sm font-black text-foreground flex items-center gap-1 hover:text-neutral-600 transition-colors">
                {suggestion.firstName}
                {suggestion.isVerified && <VerifiedBadge className="w-3.5 h-3.5" />}
              </p>
            </Link>
            <div className="flex items-center gap-1.5 mt-0.5 flex-wrap">
              <span className="text-xs font-bold text-foreground/70">
                {toPersianDigits(suggestion.age)} ساله
              </span>
              <span className="text-foreground/20">|</span>
              <span className="text-xs font-bold text-foreground/70 flex items-center gap-0.5">
                <MapPin className="w-2.5 h-2.5 text-neutral-500" />
                {suggestion.city}
              </span>
            </div>
            {suggestion.bio && (
              <p className="text-xs text-foreground/50 mt-0.5 line-clamp-1">{suggestion.bio}</p>
            )}
          </div>

          {/* دکمه ها */}
          <div className="flex items-center gap-1.5 shrink-0">
            {needSub ? (
              <button
                onClick={() => router.push("/dashboard/subscription")}
                className="px-3 py-2 rounded-xl bg-ig-blue text-white text-xs font-black flex items-center justify-center gap-1 hover:bg-ig-blue active:scale-95 transition-all"
              >
                <Crown className="w-3.5 h-3.5" />
                اشتراک
              </button>
            ) : (
              <button
                onClick={startChat}
                disabled={chatLoading}
                className="px-3 py-2 rounded-xl bg-ig-blue text-white text-xs font-black flex items-center justify-center gap-1 hover:bg-ig-blue-hover active:scale-95 transition-all disabled:opacity-50"
              >
                <MessageCircle className="w-3.5 h-3.5" />
                {chatLoading ? "..." : "گفتگو"}
              </button>
            )}
            <Link
              href={`/profile/${suggestion.username}`}
              className="px-3 py-2 rounded-xl bg-white border border-neutral-200 text-neutral-800 text-xs font-black flex items-center justify-center hover:bg-neutral-50 active:scale-95 transition-all"
            >
              پروفایل
            </Link>
          </div>
        </div>
      </div>
    </div>
  );
}
