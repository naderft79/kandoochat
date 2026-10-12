"use client";

// کامپوننت نمودارهای آماری پیشرفته پنل ادمین (ECharts با پالت تم روشن/تاریک)
import { useEffect, useMemo, useState } from "react";
import {
  MessageCircle, MapPin, Users, Heart, Rocket, Crown, Coins, Activity, DollarSign, BarChart3,
} from "lucide-react";
import { toPersianDigits, formatToman } from "@/lib/format";
import EChart from "@/components/admin/charts/EChart";
import { useChartPalette, type ChartPalette } from "@/components/admin/charts/palette";
import { cartesianOption, donutOption, compactFa } from "@/components/admin/charts/options";

type ChartData = {
  userGrowth: { date: string; count: number; total: number }[];
  dailyRevenue: { date: string; amount: number; coins: number }[];
  dailyMessages: { date: string; count: number }[];
  dailyLikes: { date: string; likes: number; superLikes: number }[];
  dailyBoosts: { date: string; count: number }[];
  dailySubs: { date: string; count: number }[];
  dailyTransfers: { date: string; volume: number; count: number }[];
  cityDistribution: { name: string; value: number }[];
  genderDistribution: { name: string; value: number }[];
  ageDistribution: { name: string; value: number }[];
  revenueByType: { name: string; value: number; count: number }[];
  summary: {
    totalLikes: number;
    totalSuperLikes: number;
    totalBoosts: number;
    totalTransfers: number;
    totalSubs: number;
    activeSubs: number;
    totalRevenue: number;
  };
};

const countFa = (v: number) => toPersianDigits(Math.round(v).toLocaleString("en-US").replace(/,/g, "،"));

function ChartCard({ icon: Icon, title, subtitle, children, className = "", stagger = "" }: {
  icon: React.ComponentType<{ className?: string; strokeWidth?: number }>;
  title: string;
  subtitle?: string;
  children: React.ReactNode;
  className?: string;
  stagger?: string;
}) {
  return (
    <div className={`lux-card p-5 hover:-translate-y-0.5 animate-fade-in-up ${stagger} ${className}`}>
      <div className="flex items-center gap-2 mb-4">
        <div className="w-8 h-8 rounded-lg bg-[rgba(212,175,55,0.08)] border border-[rgba(212,175,55,0.15)] flex items-center justify-center transition-transform hover:scale-110">
          <Icon className="w-4 h-4 text-[#d4af37]" strokeWidth={2} />
        </div>
        <div>
          <h3 className="text-sm font-bold text-foreground">{title}</h3>
          {subtitle && <p className="text-[10px] text-[#888]">{subtitle}</p>}
        </div>
      </div>
      {children}
    </div>
  );
}

function StatCard({ icon: Icon, label, value, color, trend }: {
  icon: React.ComponentType<{ className?: string; strokeWidth?: number; style?: React.CSSProperties }>;
  label: string;
  value: string;
  color: string;
  trend?: string;
}) {
  return (
    <div className="lux-card p-3">
      <div className="flex items-center gap-2 mb-1.5">
        <div className="w-7 h-7 rounded-lg flex items-center justify-center" style={{ background: `${color}15`, border: `1px solid ${color}30` }}>
          <Icon className="w-3.5 h-3.5" strokeWidth={2.5} style={{ color }} />
        </div>
        <span className="text-[10px] text-[#888] font-bold">{label}</span>
      </div>
      <p className="text-sm font-extrabold text-foreground">{value}</p>
      {trend && <p className="text-[10px] text-[#888] mt-0.5">{trend}</p>}
    </div>
  );
}

// ساخت همه گزینه های نمودارها از یک داده و پالت (فقط وقتی داده یا تم عوض شود)
function buildOptions(p: ChartPalette, data: ChartData) {
  return {
    userGrowth: cartesianOption(p, {
      categories: data.userGrowth.map((d) => d.date),
      series: [
        { name: "کل کاربران", kind: "line", data: data.userGrowth.map((d) => d.total), color: p.series[2] },
        { name: "کاربران جدید", kind: "area", data: data.userGrowth.map((d) => d.count), color: p.series[0] },
      ],
      valueFormatter: countFa,
      axisFormatter: compactFa,
    }),
    dailyRevenue: cartesianOption(p, {
      categories: data.dailyRevenue.map((d) => d.date),
      series: [{ name: "درآمد", kind: "bar", data: data.dailyRevenue.map((d) => d.amount), color: p.series[1] }],
      valueFormatter: (v) => formatToman(v),
      axisFormatter: compactFa,
    }),
    dailyMessages: cartesianOption(p, {
      categories: data.dailyMessages.map((d) => d.date),
      series: [{ name: "پیام ها", kind: "area", data: data.dailyMessages.map((d) => d.count), color: p.series[4] }],
      valueFormatter: countFa,
      axisFormatter: compactFa,
    }),
    dailyLikes: cartesianOption(p, {
      categories: data.dailyLikes.map((d) => d.date),
      series: [
        { name: "لایک", kind: "bar", data: data.dailyLikes.map((d) => d.likes), color: p.series[3] },
        { name: "سوپرلایک", kind: "bar", data: data.dailyLikes.map((d) => d.superLikes), color: p.series[0] },
      ],
      valueFormatter: countFa,
      axisFormatter: compactFa,
    }),
    dailyBoosts: cartesianOption(p, {
      categories: data.dailyBoosts.map((d) => d.date),
      series: [{ name: "بوست", kind: "bar", data: data.dailyBoosts.map((d) => d.count), color: p.series[5] }],
      valueFormatter: countFa,
      axisFormatter: compactFa,
    }),
    dailySubs: cartesianOption(p, {
      categories: data.dailySubs.map((d) => d.date),
      series: [{ name: "اشتراک جدید", kind: "area", data: data.dailySubs.map((d) => d.count), color: p.series[2] }],
      valueFormatter: countFa,
      axisFormatter: compactFa,
    }),
    dailyTransfers: cartesianOption(p, {
      categories: data.dailyTransfers.map((d) => d.date),
      series: [{ name: "حجم سکه", kind: "area", data: data.dailyTransfers.map((d) => d.volume), color: p.series[6] }],
      valueFormatter: countFa,
      axisFormatter: compactFa,
    }),
    cityDistribution: donutOption(p, data.cityDistribution, countFa),
    genderDistribution: donutOption(p, data.genderDistribution, countFa),
    ageDistribution: cartesianOption(p, {
      categories: data.ageDistribution.map((d) => d.name),
      series: [{ name: "کاربران", kind: "bar", data: data.ageDistribution.map((d) => d.value), color: p.series[7] }],
      horizontal: true,
      valueFormatter: countFa,
      axisFormatter: compactFa,
    }),
    revenueByType: cartesianOption(p, {
      categories: data.revenueByType.map((d) => d.name),
      series: [{ name: "درآمد", kind: "bar", data: data.revenueByType.map((d) => d.value), color: p.series[0] }],
      valueFormatter: (v) => formatToman(v),
      axisFormatter: compactFa,
    }),
  };
}

function Dashboard({ data }: { data: ChartData }) {
  const palette = useChartPalette();
  const opts = useMemo(() => buildOptions(palette, data), [palette, data]);
  const s = data.summary;

  return (
    <div className="space-y-4 mt-6">
      {/* خلاصه عددی */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-3">
        <StatCard icon={Heart} label="کل لایک ها" value={countFa(s.totalLikes)} color="#f87171" trend={`${countFa(s.totalSuperLikes)} سوپرلایک`} />
        <StatCard icon={Rocket} label="بوست ها" value={countFa(s.totalBoosts)} color="#fb923c" />
        <StatCard icon={Coins} label="انتقال سکه" value={countFa(s.totalTransfers)} color="#22d3ee" />
        <StatCard icon={Crown} label="اشتراک فعال" value={countFa(s.activeSubs)} color="#34d399" trend={`${countFa(s.totalSubs)} کل خرید`} />
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
        <ChartCard icon={Users} title="رشد کاربران" subtitle="۳۰ روز اخیر — جدید و تجمعی" stagger="stagger-1">
          <EChart label="نمودار رشد کاربران" option={opts.userGrowth} height={240} />
        </ChartCard>
        <ChartCard icon={DollarSign} title="درآمد روزانه" subtitle="۳۰ روز اخیر — تومان" stagger="stagger-2">
          <EChart label="نمودار درآمد روزانه" option={opts.dailyRevenue} height={240} />
        </ChartCard>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
        <ChartCard icon={MessageCircle} title="پیام های روزانه" subtitle="۳۰ روز اخیر" stagger="stagger-1">
          <EChart label="نمودار پیام های روزانه" option={opts.dailyMessages} height={240} />
        </ChartCard>
        <ChartCard icon={Heart} title="لایک و سوپرلایک" subtitle="۳۰ روز اخیر" stagger="stagger-2">
          <EChart label="نمودار لایک و سوپرلایک" option={opts.dailyLikes} height={240} />
        </ChartCard>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
        <ChartCard icon={Rocket} title="بوست های خریداری شده" subtitle="۳۰ روز اخیر" stagger="stagger-1">
          <EChart label="نمودار بوست های خریداری شده" option={opts.dailyBoosts} height={240} />
        </ChartCard>
        <ChartCard icon={Crown} title="اشتراک های جدید" subtitle="۳۰ روز اخیر" stagger="stagger-2">
          <EChart label="نمودار اشتراک های جدید" option={opts.dailySubs} height={240} />
        </ChartCard>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
        <ChartCard icon={Coins} title="حجم انتقال سکه" subtitle="۳۰ روز اخیر" stagger="stagger-1">
          <EChart label="نمودار حجم انتقال سکه" option={opts.dailyTransfers} height={240} />
        </ChartCard>
        <ChartCard icon={MapPin} title="توزیع کاربران (شهر)" subtitle="۱۰ شهر برتر" stagger="stagger-2">
          <EChart label="نمودار توزیع کاربران بر اساس شهر" option={opts.cityDistribution} height={260} />
        </ChartCard>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
        <ChartCard icon={Users} title="توزیع جنسیت" subtitle="کاربران فعال" stagger="stagger-1">
          <EChart label="نمودار توزیع جنسیت" option={opts.genderDistribution} height={220} />
        </ChartCard>
        <ChartCard icon={Activity} title="توزیع سنی کاربران" subtitle="بازه های سنی" stagger="stagger-2">
          <EChart label="نمودار توزیع سنی" option={opts.ageDistribution} height={220} />
        </ChartCard>
      </div>

      <ChartCard icon={BarChart3} title="درآمد بر اساس نوع تراکنش" subtitle="کل درآمد — تفکیک شده" className="w-full" stagger="stagger-1">
        <EChart label="نمودار درآمد بر اساس نوع تراکنش" option={opts.revenueByType} height={240} />
      </ChartCard>
    </div>
  );
}

export default function AdminCharts() {
  const [data, setData] = useState<ChartData | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetch("/api/admin/stats/charts")
      .then((r) => r.json())
      .then((d) => { if (d.userGrowth) setData(d); })
      .catch(() => {})
      .finally(() => setLoading(false));
  }, []);

  if (loading) {
    return (
      <div className="space-y-4 mt-6">
        <div className="grid grid-cols-2 lg:grid-cols-4 gap-3">
          {Array.from({ length: 4 }).map((_, i) => (
            <div key={i} className="lux-card p-4 h-20 lux-shimmer" />
          ))}
        </div>
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
          {Array.from({ length: 6 }).map((_, i) => (
            <div key={i} className="lux-card p-5 h-64 lux-shimmer" />
          ))}
        </div>
      </div>
    );
  }

  if (!data) {
    return (
      <div className="text-center py-10 text-[#888] text-sm">
        خطا در بارگذاری نمودارها
      </div>
    );
  }

  return <Dashboard data={data} />;
}
