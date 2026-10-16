"use client";

// هدر آمار لحظه ای — در بالای تمام صفحات ادمین
import { useState, useEffect } from "react";
import {
  Users,
  Wifi,
  UserPlus,
  DollarSign,
  Wallet,
  MessageSquare,
  MessagesSquare,
  Venus,
  Mars,
} from "lucide-react";
import { toPersianDigits, formatToman } from "@/lib/format";

type Stats = {
  totalUsers: number;
  onlineUsers: number;
  todaySignups: number;
  totalMales: number;
  totalFemales: number;
  todayMessages: number;
  totalMessages: number;
  todayRevenue: number;
  totalRevenue: number;
};

export default function AdminStatsHeader() {
  const [stats, setStats] = useState<Stats | null>(null);

  useEffect(() => {
    async function fetchStats() {
      try {
        const res = await fetch("/api/admin/stats-header");
        if (res.ok) {
          const data = await res.json();
          setStats(data);
        }
      } catch {
        // ignore
      }
    }
    fetchStats();
    // تازه سازی خودکار هر ۵ ثانیه — در تب پنهان متوقف می شود تا بار سرور هدر نرود
    const interval = setInterval(() => {
      if (document.visibilityState === "visible") fetchStats();
    }, 5000);
    return () => clearInterval(interval);
  }, []);

  if (!stats) {
    return (
      <div className="grid grid-cols-2 gap-2 mb-4 lg:flex lg:flex-wrap">
        {Array.from({ length: 9 }).map((_, i) => (
          <div key={i} className="lux-card rounded-xl p-3 flex items-center gap-2 animate-pulse">
            <div className="h-4 w-4 lux-shimmer rounded" />
            <div className="h-5 w-12 lux-shimmer rounded" />
          </div>
        ))}
      </div>
    );
  }

  const items = [
    { label: "کل کاربران", value: toPersianDigits(stats.totalUsers), icon: Users },
    { label: "ثبت نام امروز", value: toPersianDigits(stats.todaySignups), icon: UserPlus },
    { label: "آنلاین", value: toPersianDigits(stats.onlineUsers), icon: Wifi },
    { label: "درآمد امروز", value: formatToman(stats.todayRevenue), icon: DollarSign },
    { label: "درآمد کل", value: formatToman(stats.totalRevenue), icon: Wallet },
    { label: "چت امروز", value: toPersianDigits(stats.todayMessages), icon: MessageSquare },
    { label: "کل چت ها", value: toPersianDigits(stats.totalMessages), icon: MessagesSquare },
    { label: "دختران", value: toPersianDigits(stats.totalFemales), icon: Venus },
    { label: "پسران", value: toPersianDigits(stats.totalMales), icon: Mars },
  ];

  return (
    <div className="mb-4">
      {/* موبایل: دقیقا ۲ کارت ۵۰درصدی در هر ردیف — دسکتاپ: همان flex قبلی */}
      <div className="grid grid-cols-2 gap-2 mb-8 lg:flex lg:flex-wrap">
        {items.map((item) => (
          <div
            key={item.label}
            className="lux-card px-4 py-3 flex items-center gap-2.5"
          >
            <div className="w-9 h-9 rounded-lg bg-[rgba(212,175,55,0.08)] border border-[rgba(212,175,55,0.15)] flex items-center justify-center shrink-0">
              <item.icon className="w-4 h-4 text-[#d4af37]" strokeWidth={2.5} />
            </div>
            <div className="flex flex-col gap-1">
              <span className="text-[11px] text-[#888] font-bold leading-tight">{item.label}</span>
              <span className="text-base font-extrabold text-[#e8e8e8] leading-tight tracking-tight whitespace-nowrap">{item.value}</span>
            </div>
          </div>
        ))}
      </div>
      <div className="lux-divider" />
    </div>
  );
}
