"use client";

// داشبورد آمار زنده ادمین — ۶۴ شاخص در گروه ها، سری ۱۴ روزه و به‌روزرسانی هر ۳۰ ثانیه
import { useEffect, useState, useCallback } from "react";
import { motion } from "framer-motion";
import { Area, AreaChart, CartesianGrid, ResponsiveContainer, Tooltip, XAxis, YAxis } from "recharts";
import { Activity } from "lucide-react";
import { formatCoins, formatToman, toPersianDigits } from "@/lib/format";
import type { AdminStats, Kpi, KpiFormat } from "@/lib/admin-stats";

const REFRESH_MS = 30_000;

function formatValue(value: number, format: KpiFormat): string {
  switch (format) {
    case "toman":
      return formatToman(value);
    case "coins":
      return formatCoins(value);
    case "percent":
      return `${toPersianDigits(String(value))}٪`;
    default:
      return toPersianDigits(value.toLocaleString("en-US").replace(/,/g, "،"));
  }
}

const dayLabel = (day: string) =>
  new Intl.DateTimeFormat("fa-IR-u-ca-persian", { month: "short", day: "numeric" }).format(new Date(day));

function KpiCard({ kpi, index }: { kpi: Kpi; index: number }) {
  return (
    <motion.div
      initial={{ opacity: 0, y: 8 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ delay: Math.min(index * 0.02, 0.5), duration: 0.25 }}
      className="lux-card p-4"
    >
      <p className="text-[11px] text-[#888] truncate">{kpi.label}</p>
      <p className="mt-2 text-lg font-black text-[#e8e8e8] tabular-nums truncate">{formatValue(kpi.value, kpi.format)}</p>
    </motion.div>
  );
}

export default function StatsDashboardClient({ initial }: { initial: AdminStats }) {
  const [stats, setStats] = useState<AdminStats>(initial);
  const [error, setError] = useState(false);

  const refresh = useCallback(async () => {
    try {
      const res = await fetch("/api/admin/stats/kpis", { cache: "no-store" });
      if (!res.ok) throw new Error(String(res.status));
      setStats((await res.json()) as AdminStats);
      setError(false);
    } catch {
      setError(true);
    }
  }, []);

  useEffect(() => {
    const timer = setInterval(() => void refresh(), REFRESH_MS);
    return () => clearInterval(timer);
  }, [refresh]);

  const total = stats.groups.reduce((sum, g) => sum + g.kpis.length, 0);
  // اندیس شروع هر گروه برای تاخیر انیمیشن ورود (بدون تغییر متغیر در حین رندر)
  const offsets = stats.groups.map((_, gi) => stats.groups.slice(0, gi).reduce((n, g) => n + g.kpis.length, 0));

  return (
    <div className="space-y-6">
      <div className="lux-card p-5 flex flex-wrap items-center justify-between gap-3">
        <div>
          <h1 className="text-lg font-black text-[#e8e8e8] flex items-center gap-2">
            <Activity className="w-5 h-5 text-[#d4af37]" />
            آمار
          </h1>
          <p className="text-[#888] mt-1 text-xs">{toPersianDigits(total)} شاخص · به‌روزرسانی هر ۳۰ ثانیه</p>
        </div>
        <span className="flex items-center gap-1.5 text-[11px] text-[#666]">
          <span className="relative flex h-2 w-2">
            <span className="absolute inline-flex h-full w-full rounded-full bg-[#34d399] opacity-60 animate-ping" />
            <span className="relative inline-flex h-2 w-2 rounded-full bg-[#34d399]" />
          </span>
          {error ? "خطا در به‌روزرسانی" : "زنده"}
        </span>
      </div>

      <div className="grid grid-cols-1 xl:grid-cols-2 gap-4">
        <div className="lux-card p-4">
          <p className="text-xs font-bold text-[#e8e8e8] mb-3">ثبت نام ۱۴ روز اخیر</p>
          <div className="h-56">
            <ResponsiveContainer width="100%" height="100%">
              <AreaChart data={stats.daily}>
                <defs>
                  <linearGradient id="usersFill" x1="0" y1="0" x2="0" y2="1">
                    <stop offset="0%" stopColor="#d4af37" stopOpacity={0.4} />
                    <stop offset="100%" stopColor="#d4af37" stopOpacity={0} />
                  </linearGradient>
                </defs>
                <CartesianGrid stroke="rgba(212,175,55,0.08)" vertical={false} />
                <XAxis dataKey="day" tickFormatter={dayLabel} tick={{ fill: "#888", fontSize: 10 }} />
                <YAxis allowDecimals={false} tick={{ fill: "#888", fontSize: 10 }} />
                <Tooltip labelFormatter={(d) => dayLabel(String(d))} contentStyle={{ background: "#12101c", border: "1px solid rgba(212,175,55,0.2)", borderRadius: 12 }} />
                <Area type="monotone" dataKey="users" name="ثبت نام" stroke="#d4af37" fill="url(#usersFill)" strokeWidth={2} />
              </AreaChart>
            </ResponsiveContainer>
          </div>
        </div>

        <div className="lux-card p-4">
          <p className="text-xs font-bold text-[#e8e8e8] mb-3">درآمد خرید سکه ۱۴ روز اخیر (تومان)</p>
          <div className="h-56">
            <ResponsiveContainer width="100%" height="100%">
              <AreaChart data={stats.daily}>
                <defs>
                  <linearGradient id="revFill" x1="0" y1="0" x2="0" y2="1">
                    <stop offset="0%" stopColor="#34d399" stopOpacity={0.4} />
                    <stop offset="100%" stopColor="#34d399" stopOpacity={0} />
                  </linearGradient>
                </defs>
                <CartesianGrid stroke="rgba(212,175,55,0.08)" vertical={false} />
                <XAxis dataKey="day" tickFormatter={dayLabel} tick={{ fill: "#888", fontSize: 10 }} />
                <YAxis tick={{ fill: "#888", fontSize: 10 }} />
                <Tooltip labelFormatter={(d) => dayLabel(String(d))} formatter={(v) => formatToman(Number(v))} contentStyle={{ background: "#12101c", border: "1px solid rgba(212,175,55,0.2)", borderRadius: 12 }} />
                <Area type="monotone" dataKey="revenueToman" name="درآمد" stroke="#34d399" fill="url(#revFill)" strokeWidth={2} />
              </AreaChart>
            </ResponsiveContainer>
          </div>
        </div>
      </div>

      {stats.groups.map((group, gi) => (
        <section key={group.title} className="space-y-3">
          <h2 className="text-sm font-black text-[#d4af37]">{group.title}</h2>
          <div className="grid grid-cols-2 md:grid-cols-3 xl:grid-cols-4 gap-3">
            {group.kpis.map((kpi, ki) => (
              <KpiCard key={kpi.key} kpi={kpi} index={offsets[gi] + ki} />
            ))}
          </div>
        </section>
      ))}
    </div>
  );
}
