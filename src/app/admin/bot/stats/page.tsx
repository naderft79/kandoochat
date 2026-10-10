"use client";

import { useState, useEffect, useCallback } from "react";
import { motion } from "framer-motion";
import { BarChart3, Loader2, RefreshCw, TrendingUp, MessageSquare, Heart, Eye, Gift, UserCheck, ScrollText } from "lucide-react";
import { toPersianDigits } from "@/lib/format";

type StatsData = {
  fakeUsers: number;
  totalSent: number;
  sentToday: number;
  sent7Days: number;
  sent30Days: number;
  totalAnswered: number;
  responseRate: number;
  dynamicTemplates: number;
  blacklistCount: number;
  whitelistCount: number;
  likeBotLogs: number;
  viewBotLogs: number;
  giftBotLogs: number;
  matchBotLogs: number;
  storyBotLogs: number;
  autoReplyLogs: number;
  daily: Record<string, number>;
  templateStats: { id: string; text: string; category: string; sendCount: number; answerCount: number; weight: number }[];
  categoryStats: Record<string, { sent: number; answered: number }>;
};

const CATEGORY_LABELS: Record<string, string> = {
  CHAT_START: "شروع گفتگو",
  FLIRTY: "شیطنت آمیز",
  CASUAL: "راحت",
  COMPLIMENT: "تعریف",
  CURIOSITY: "کنجکاوی",
  PLAYFUL: "شوخ طبعانه",
  WARM: "صمیمی",
};

export default function StatsPage() {
  const [stats, setStats] = useState<StatsData | null>(null);
  const [loading, setLoading] = useState(true);

  const fetchStats = useCallback(async () => {
    setLoading(true);
    try {
      const res = await fetch("/api/admin/bot/stats");
      const data = await res.json();
      if (res.ok) setStats(data);
    } catch { /* */ } finally { setLoading(false); }
  }, []);

  useEffect(() => { fetchStats(); }, [fetchStats]);

  if (loading || !stats) {
    return (
      <div className="flex items-center justify-center py-20">
        <Loader2 className="w-8 h-8 text-[#d4af37] animate-spin" />
      </div>
    );
  }

  const statCards = [
    { label: "کاربران فیک", value: stats.fakeUsers, color: "#d4af37", icon: UserCheck },
    { label: "کل پیام ها", value: stats.totalSent, color: "#e8e8e8", icon: MessageSquare },
    { label: "پیام امروز", value: stats.sentToday, color: "#4ade80", icon: TrendingUp },
    { label: "پیام ۷ روز", value: stats.sent7Days, color: "#60a5fa", icon: TrendingUp },
    { label: "پیام ۳۰ روز", value: stats.sent30Days, color: "#a78bfa", icon: TrendingUp },
    { label: "نرخ پاسخ", value: `${toPersianDigits(stats.responseRate)}٪`, color: "#fbbf24", icon: TrendingUp },
    { label: "قالب داینامیک", value: stats.dynamicTemplates, color: "#f472b6", icon: ScrollText },
    { label: "لیست سیاه", value: stats.blacklistCount, color: "#ef4444", icon: ScrollText },
  ];

  const subBotStats = [
    { label: "لایک", value: stats.likeBotLogs, icon: Heart, color: "#f472b6" },
    { label: "بازدید پروفایل", value: stats.viewBotLogs, icon: Eye, color: "#60a5fa" },
    { label: "بازدید استوری", value: stats.storyBotLogs, icon: Eye, color: "#a78bfa" },
    { label: "هدیه", value: stats.giftBotLogs, icon: Gift, color: "#fbbf24" },
    { label: "مچ", value: stats.matchBotLogs, icon: UserCheck, color: "#4ade80" },
    { label: "پاسخ خودکار", value: stats.autoReplyLogs, icon: MessageSquare, color: "#fb923c" },
  ];

  return (
    <div className="space-y-4">
      {/* هدر */}
      <div className="lux-card p-5">
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-lg font-black text-[#e8e8e8] flex items-center gap-2">
              <BarChart3 className="w-5 h-5 text-[#d4af37]" />
              آمار ربات
            </h1>
            <p className="text-[#888] mt-1 text-xs">آمار کامل پیام، ربات‌های جانبی و قالب‌ها</p>
          </div>
          <button onClick={() => fetchStats()} className="px-3 py-2 rounded-xl lux-card text-xs font-bold text-[#888] hover:text-[#d4af37] flex items-center gap-1.5 transition-all">
            <RefreshCw className="w-4 h-4" />
          </button>
        </div>
      </div>

      {/* کارت آمار اصلی */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
        {statCards.map((card, i) => {
          const Icon = card.icon;
          return (
            <motion.div
              key={card.label}
              initial={{ opacity: 0, scale: 0.95 }}
              animate={{ opacity: 1, scale: 1 }}
              transition={{ delay: i * 0.03 }}
              className="lux-card p-4"
            >
              <Icon className="w-4 h-4 mb-2" style={{ color: card.color }} />
              <p className="text-[10px] text-[#888]">{card.label}</p>
              <p className="text-lg font-black" style={{ color: card.color }}>
                {typeof card.value === "number" ? toPersianDigits(card.value) : card.value}
              </p>
            </motion.div>
          );
        })}
      </div>

      {/* آمار ربات‌های جانبی */}
      <div className="lux-card p-5">
        <h2 className="text-sm font-black text-[#d4af37] mb-3">ربات های جانبی</h2>
        <div className="grid grid-cols-2 md:grid-cols-3 gap-3">
          {subBotStats.map((s) => {
            const Icon = s.icon;
            return (
              <div key={s.label} className="flex items-center gap-2 p-3 rounded-lg bg-[#0d0d0d] border border-[rgba(212,175,55,0.1)]">
                <Icon className="w-4 h-4" style={{ color: s.color }} />
                <div>
                  <p className="text-[10px] text-[#888]">{s.label}</p>
                  <p className="text-sm font-black" style={{ color: s.color }}>{toPersianDigits(s.value)}</p>
                </div>
              </div>
            );
          })}
        </div>
      </div>

      {/* نمودار روزانه */}
      {Object.keys(stats.daily).length > 0 && (
        <div className="lux-card p-5">
          <h2 className="text-sm font-black text-[#d4af37] mb-3">پیام روزانه (۷ روز اخیر)</h2>
          <div className="flex items-end gap-2 h-32">
            {Object.entries(stats.daily).map(([day, count]) => {
              const max = Math.max(...Object.values(stats.daily), 1);
              const height = (count / max) * 100;
              return (
                <div key={day} className="flex-1 flex flex-col items-center gap-1">
                  <div className="w-full rounded-t bg-gradient-to-t from-[#d4af37] to-[#fbbf24]" style={{ height: `${height}%` }} />
                  <p className="text-[8px] text-[#888]">{day.slice(5)}</p>
                  <p className="text-[8px] text-[#d4af37] font-bold">{toPersianDigits(count)}</p>
                </div>
              );
            })}
          </div>
        </div>
      )}

      {/* آمار دسته قالب‌ها */}
      {Object.keys(stats.categoryStats).length > 0 && (
        <div className="lux-card p-5">
          <h2 className="text-sm font-black text-[#d4af37] mb-3">آمار دسته قالب ها</h2>
          <div className="space-y-2">
            {Object.entries(stats.categoryStats).map(([cat, data]) => (
              <div key={cat} className="flex items-center justify-between p-2 rounded-lg bg-[#0d0d0d] border border-[rgba(212,175,55,0.1)]">
                <span className="text-xs text-[#e8e8e8]">{CATEGORY_LABELS[cat] ?? cat}</span>
                <div className="flex gap-3">
                  <span className="text-[10px] text-[#888]">ارسال: <span className="text-[#d4af37] font-bold">{toPersianDigits(data.sent)}</span></span>
                  <span className="text-[10px] text-[#888]">پاسخ: <span className="text-[#4ade80] font-bold">{toPersianDigits(data.answered)}</span></span>
                </div>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* قالب‌های برتر */}
      {stats.templateStats.length > 0 && (
        <div className="lux-card p-5">
          <h2 className="text-sm font-black text-[#d4af37] mb-3">قالب های پراستفاده</h2>
          <div className="space-y-2 max-h-60 overflow-y-auto">
            {stats.templateStats.slice(0, 10).map((t) => (
              <div key={t.id} className="p-2 rounded-lg bg-[#0d0d0d] border border-[rgba(212,175,55,0.1)]">
                <p className="text-xs text-[#e8e8e8] mb-1">{t.text.substring(0, 60)}...</p>
                <div className="flex gap-3">
                  <span className="text-[9px] text-[#888]">ارسال: <span className="text-[#d4af37]">{toPersianDigits(t.sendCount)}</span></span>
                  <span className="text-[9px] text-[#888]">پاسخ: <span className="text-[#4ade80]">{toPersianDigits(t.answerCount)}</span></span>
                  <span className="text-[9px] text-[#888]">وزن: <span className="text-[#e8e8e8]">{toPersianDigits(t.weight)}</span></span>
                </div>
              </div>
            ))}
          </div>
        </div>
      )}
    </div>
  );
}
