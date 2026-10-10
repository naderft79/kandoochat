"use client";

// پنل آمار Retention و Churn
import { useEffect, useState } from "react";
import { TrendingUp, TrendingDown, Users, Activity, Crown, Flame, Loader2 } from "lucide-react";
import { toPersianDigits } from "@/lib/format";

type RetentionData = {
  dailyRegistrations: { date: string; count: number }[];
  dau: number;
  wau: number;
  mau: number;
  totalActive: number;
  churned: number;
  newToday: number;
  newThisWeek: number;
  retentionRate: number;
  churnRate: number;
  activeStreaks: number;
  activeSubscriptions: number;
};

export default function AdminRetentionPage() {
  const [data, setData] = useState<RetentionData | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetch("/api/admin/retention")
      .then((r) => r.json())
      .then((d) => { if (d.dau !== undefined) setData(d); })
      .finally(() => setLoading(false));
  }, []);

  if (loading) {
    return (
      <div className="p-8 text-center">
        <Loader2 className="w-6 h-6 animate-spin mx-auto text-[#d4af37]" />
      </div>
    );
  }

  if (!data) {
    return <div className="p-8 text-center text-sm text-[#888]">خطا در دریافت آمار</div>;
  }

  const stats = [
    { label: "کاربران فعال روزانه", value: data.dau, icon: Activity, color: "text-blue-600", bg: "bg-blue-50" },
    { label: "کاربران فعال هفتگی", value: data.wau, icon: Users, color: "text-green-600", bg: "bg-green-50" },
    { label: "کاربران فعال ماهانه", value: data.mau, icon: Users, color: "text-purple-600", bg: "bg-purple-50" },
    { label: "کل کاربران فعال", value: data.totalActive, icon: Users, color: "text-foreground", bg: "bg-neutral-100" },
    { label: "کاربران ریزش کرده", value: data.churned, icon: TrendingDown, color: "text-red-600", bg: "bg-red-50" },
    { label: "ثبت نام امروز", value: data.newToday, icon: TrendingUp, color: "text-green-600", bg: "bg-green-50" },
    { label: "ثبت نام این هفته", value: data.newThisWeek, icon: TrendingUp, color: "text-blue-600", bg: "bg-blue-50" },
    { label: "استریک های فعال", value: data.activeStreaks, icon: Flame, color: "text-orange-600", bg: "bg-orange-50" },
    { label: "اشتراک های فعال", value: data.activeSubscriptions, icon: Crown, color: "text-amber-600", bg: "bg-amber-50" },
  ];

  return (
    <div className="p-4 md:p-8 max-w-4xl mx-auto">
      <div className="flex items-center gap-3 mb-6">
        <div className="w-10 h-10 rounded-xl lux-btn-gold flex items-center justify-center">
          <TrendingUp className="w-5 h-5 text-[#0d0d0d]" />
        </div>
        <div>
          <h1 className="text-lg font-black text-[#e8e8e8]">آمار Retention</h1>
          <p className="text-xs text-[#888]">نرخ نگهداشت و ریزش کاربران</p>
        </div>
      </div>

      {/* نرخ کلیدی */}
      <div className="grid grid-cols-2 gap-3 mb-6">
        <div className="lux-card p-4 text-center">
          <p className="text-xs text-[#888] mb-1">نرخ Retention (DAU/MAU)</p>
          <p className="text-2xl font-bold text-[#34d399]">{toPersianDigits(data.retentionRate)}٪</p>
        </div>
        <div className="lux-card p-4 text-center">
          <p className="text-xs text-[#888] mb-1">نرخ Churn</p>
          <p className="text-2xl font-bold text-[#f87171]">{toPersianDigits(data.churnRate)}٪</p>
        </div>
      </div>

      {/* آمار عددی */}
      <div className="grid grid-cols-2 md:grid-cols-3 gap-3 mb-6">
        {stats.map((s) => (
          <div key={s.label} className="lux-card p-3 flex items-center gap-3">
            <div className={`w-10 h-10 rounded-xl ${s.bg} flex items-center justify-center shrink-0`}>
              <s.icon className={`w-5 h-5 ${s.color}`} />
            </div>
            <div className="min-w-0">
              <p className="text-[10px] text-[#888] truncate">{s.label}</p>
              <p className="text-sm font-bold text-[#e8e8e8]">{toPersianDigits(s.value)}</p>
            </div>
          </div>
        ))}
      </div>

      {/* نمودار ثبت نام روزانه */}
      <div className="lux-card p-4">
        <p className="text-xs font-bold text-[#d4af37] mb-3">ثبت نام روزانه (۷ روز اخیر)</p>
        <div className="flex items-end justify-between gap-2 h-32">
          {data.dailyRegistrations.map((d) => {
            const maxCount = Math.max(...data.dailyRegistrations.map((x) => x.count), 1);
            const height = (d.count / maxCount) * 100;
            return (
              <div key={d.date} className="flex-1 flex flex-col items-center gap-1">
                <span className="text-[10px] font-bold text-[#e8e8e8]">{toPersianDigits(d.count)}</span>
                <div
                  className="w-full rounded-t-lg bg-gradient-to-t from-[#d4af37] to-[#f0d060] transition-all"
                  style={{ height: `${Math.max(height, 4)}%` }}
                />
                <span className="text-[9px] text-[#888]">
                  {toPersianDigits(parseInt(d.date.split("-")[2]))}
                </span>
              </div>
            );
          })}
        </div>
      </div>
    </div>
  );
}
