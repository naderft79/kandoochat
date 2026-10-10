"use client";

// کامپوننت نمودارهای آماری پیشرفته پنل ادمین
import { useEffect, useState } from "react";
import {
  AreaChart, Area, BarChart, Bar,
  PieChart, Pie, Cell, RadialBarChart, RadialBar,
  XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, Legend,
} from "recharts";
import {
  DollarSign, MessageCircle, MapPin, Users,
  Heart, Rocket, Crown, Coins, Activity, Gift, BarChart3,
} from "lucide-react";
import { toPersianDigits, formatToman, formatCoins } from "@/lib/format";

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

const PIE_COLORS = [
  "#6366f1", "#ec4899", "#f59e0b", "#10b981", "#8b5cf6",
  "#ef4444", "#facc15", "#06b6d4", "#84cc16", "#a855f7",
];
const GENDER_COLORS = ["#6366f1", "#ec4899"];

function CustomTooltip({ active, payload, label, formatter }: {
  active?: boolean;
  payload?: { name?: string; value?: number; color?: string }[];
  label?: string;
  formatter?: (val: number) => string;
}) {
  if (!active || !payload || payload.length === 0) return null;
  return (
    <div className="bg-[#141414]/95 backdrop-blur-md border border-[rgba(212,175,55,0.2)] rounded-xl px-3 py-2 shadow-lg">
      {label && <p className="text-[10px] text-[#888] mb-1 font-bold">{label}</p>}
      {payload.map((entry, i) => (
        <p key={i} className="text-xs font-bold flex items-center gap-1.5" style={{ color: entry.color }}>
          <span className="w-2 h-2 rounded-full" style={{ background: entry.color }} />
          {entry.name}: {formatter ? formatter(entry.value ?? 0) : toPersianDigits(entry.value ?? 0)}
        </p>
      ))}
    </div>
  );
}

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
          <h3 className="text-sm font-bold text-[#e8e8e8]">{title}</h3>
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
      <p className="text-sm font-extrabold text-[#e8e8e8]">{value}</p>
      {trend && <p className="text-[10px] text-[#888] mt-0.5">{trend}</p>}
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

  return (
    <div className="space-y-4 mt-6">
      {/* ردیف اول: رشد کاربران + درآمد */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
        <ChartCard icon={Users} title="رشد کاربران" subtitle="۳۰ روز اخیر — روزانه و تجمعی" stagger="stagger-1">
          <ResponsiveContainer width="100%" height={220}>
            <AreaChart data={data.userGrowth}>
              <defs>
                <linearGradient id="gradUsers" x1="0" y1="0" x2="0" y2="1">
                  <stop offset="0%" stopColor="#6366f1" stopOpacity={0.4} />
                  <stop offset="100%" stopColor="#6366f1" stopOpacity={0} />
                </linearGradient>
                <linearGradient id="gradTotal" x1="0" y1="0" x2="0" y2="1">
                  <stop offset="0%" stopColor="#a855f7" stopOpacity={0.2} />
                  <stop offset="100%" stopColor="#a855f7" stopOpacity={0} />
                </linearGradient>
              </defs>
              <CartesianGrid strokeDasharray="3 3" stroke="#2a2a2a" />
              <XAxis dataKey="date" tick={{ fontSize: 9 }} interval={4} stroke="#8e8e8e" />
              <YAxis tick={{ fontSize: 9 }} allowDecimals={false} stroke="#8e8e8e" />
              <Tooltip content={<CustomTooltip />} />
              <Area type="monotone" dataKey="total" stroke="#a855f7" strokeWidth={2} fill="url(#gradTotal)" name="کل کاربران" />
              <Area type="monotone" dataKey="count" stroke="#6366f1" strokeWidth={2.5} fill="url(#gradUsers)" name="کاربران جدید" />
            </AreaChart>
          </ResponsiveContainer>
        </ChartCard>

        <ChartCard icon={DollarSign} title="درآمد روزانه" subtitle="۳۰ روز اخیر — تومان" stagger="stagger-2">
          <ResponsiveContainer width="100%" height={220}>
            <BarChart data={data.dailyRevenue}>
              <defs>
                <linearGradient id="gradRevenue" x1="0" y1="0" x2="0" y2="1">
                  <stop offset="0%" stopColor="#10b981" stopOpacity={1} />
                  <stop offset="100%" stopColor="#10b981" stopOpacity={0.3} />
                </linearGradient>
              </defs>
              <CartesianGrid strokeDasharray="3 3" stroke="#2a2a2a" />
              <XAxis dataKey="date" tick={{ fontSize: 9 }} interval={4} stroke="#8e8e8e" />
              <YAxis tick={{ fontSize: 9 }} stroke="#8e8e8e" tickFormatter={(v) => v >= 1000000 ? `${(v / 1000000).toFixed(1)}م` : v >= 1000 ? `${(v / 1000).toFixed(0)}ه` : v} />
              <Tooltip content={<CustomTooltip formatter={(v) => formatToman(v)} />} />
              <Bar dataKey="amount" fill="url(#gradRevenue)" name="درآمد" radius={[6, 6, 0, 0]} />
            </BarChart>
          </ResponsiveContainer>
        </ChartCard>
      </div>

      {/* ردیف دوم: پیام ها + لایک ها */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
        <ChartCard icon={MessageCircle} title="پیام های روزانه" subtitle="۳۰ روز اخیر" stagger="stagger-1">
          <ResponsiveContainer width="100%" height={220}>
            <AreaChart data={data.dailyMessages}>
              <defs>
                <linearGradient id="gradMsg" x1="0" y1="0" x2="0" y2="1">
                  <stop offset="0%" stopColor="#ec4899" stopOpacity={0.35} />
                  <stop offset="100%" stopColor="#ec4899" stopOpacity={0} />
                </linearGradient>
              </defs>
              <CartesianGrid strokeDasharray="3 3" stroke="#2a2a2a" />
              <XAxis dataKey="date" tick={{ fontSize: 9 }} interval={4} stroke="#8e8e8e" />
              <YAxis tick={{ fontSize: 9 }} allowDecimals={false} stroke="#8e8e8e" />
              <Tooltip content={<CustomTooltip />} />
              <Area type="monotone" dataKey="count" stroke="#ec4899" strokeWidth={2.5} fill="url(#gradMsg)" name="پیام ها" />
            </AreaChart>
          </ResponsiveContainer>
        </ChartCard>

        <ChartCard icon={Heart} title="لایک و سوپرلایک" subtitle="۳۰ روز اخیر" stagger="stagger-2">
          <ResponsiveContainer width="100%" height={220}>
            <BarChart data={data.dailyLikes}>
              <defs>
                <linearGradient id="gradLike" x1="0" y1="0" x2="0" y2="1">
                  <stop offset="0%" stopColor="#f43f5e" stopOpacity={1} />
                  <stop offset="100%" stopColor="#f43f5e" stopOpacity={0.4} />
                </linearGradient>
                <linearGradient id="gradSuper" x1="0" y1="0" x2="0" y2="1">
                  <stop offset="0%" stopColor="#facc15" stopOpacity={1} />
                  <stop offset="100%" stopColor="#facc15" stopOpacity={0.4} />
                </linearGradient>
              </defs>
              <CartesianGrid strokeDasharray="3 3" stroke="#2a2a2a" />
              <XAxis dataKey="date" tick={{ fontSize: 9 }} interval={4} stroke="#8e8e8e" />
              <YAxis tick={{ fontSize: 9 }} allowDecimals={false} stroke="#8e8e8e" />
              <Tooltip content={<CustomTooltip />} cursor={{ fill: "rgba(99,102,241,0.05)" }} />
              <Legend wrapperStyle={{ fontSize: 10 }} />
              <Bar dataKey="likes" fill="url(#gradLike)" name="لایک" radius={[4, 4, 0, 0]} />
              <Bar dataKey="superLikes" fill="url(#gradSuper)" name="سوپرلایک" radius={[4, 4, 0, 0]} />
            </BarChart>
          </ResponsiveContainer>
        </ChartCard>
      </div>

      {/* ردیف سوم: بوست + اشتراک */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
        <ChartCard icon={Rocket} title="بوست های خریداری شده" subtitle="۳۰ روز اخیر" stagger="stagger-1">
          <ResponsiveContainer width="100%" height={220}>
            <BarChart data={data.dailyBoosts}>
              <defs>
                <linearGradient id="gradBoost" x1="0" y1="0" x2="0" y2="1">
                  <stop offset="0%" stopColor="#f59e0b" stopOpacity={1} />
                  <stop offset="100%" stopColor="#f59e0b" stopOpacity={0.3} />
                </linearGradient>
              </defs>
              <CartesianGrid strokeDasharray="3 3" stroke="#2a2a2a" />
              <XAxis dataKey="date" tick={{ fontSize: 9 }} interval={4} stroke="#8e8e8e" />
              <YAxis tick={{ fontSize: 9 }} allowDecimals={false} stroke="#8e8e8e" />
              <Tooltip content={<CustomTooltip />} cursor={{ fill: "rgba(245,158,11,0.05)" }} />
              <Bar dataKey="count" fill="url(#gradBoost)" name="بوست" radius={[5, 5, 0, 0]} />
            </BarChart>
          </ResponsiveContainer>
        </ChartCard>

        <ChartCard icon={Crown} title="اشتراک های جدید" subtitle="۳۰ روز اخیر" stagger="stagger-2">
          <ResponsiveContainer width="100%" height={220}>
            <AreaChart data={data.dailySubs}>
              <defs>
                <linearGradient id="gradSub" x1="0" y1="0" x2="0" y2="1">
                  <stop offset="0%" stopColor="#6366f1" stopOpacity={0.35} />
                  <stop offset="100%" stopColor="#6366f1" stopOpacity={0} />
                </linearGradient>
              </defs>
              <CartesianGrid strokeDasharray="3 3" stroke="#2a2a2a" />
              <XAxis dataKey="date" tick={{ fontSize: 9 }} interval={4} stroke="#8e8e8e" />
              <YAxis tick={{ fontSize: 9 }} allowDecimals={false} stroke="#8e8e8e" />
              <Tooltip content={<CustomTooltip />} />
              <Area type="monotone" dataKey="count" stroke="#6366f1" strokeWidth={2.5} fill="url(#gradSub)" name="اشتراک جدید" />
            </AreaChart>
          </ResponsiveContainer>
        </ChartCard>
      </div>

      {/* ردیف چهارم: انتقال سکه + توزیع شهر */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
        <ChartCard icon={Coins} title="حجم انتقال سکه" subtitle="۳۰ روز اخیر" stagger="stagger-1">
          <ResponsiveContainer width="100%" height={220}>
            <AreaChart data={data.dailyTransfers}>
              <defs>
                <linearGradient id="gradTransfer" x1="0" y1="0" x2="0" y2="1">
                  <stop offset="0%" stopColor="#06b6d4" stopOpacity={0.35} />
                  <stop offset="100%" stopColor="#06b6d4" stopOpacity={0} />
                </linearGradient>
              </defs>
              <CartesianGrid strokeDasharray="3 3" stroke="#2a2a2a" />
              <XAxis dataKey="date" tick={{ fontSize: 9 }} interval={4} stroke="#8e8e8e" />
              <YAxis tick={{ fontSize: 9 }} stroke="#8e8e8e" />
              <Tooltip content={<CustomTooltip formatter={(v) => formatCoins(v)} />} />
              <Area type="monotone" dataKey="volume" stroke="#06b6d4" strokeWidth={2.5} fill="url(#gradTransfer)" name="حجم سکه" />
            </AreaChart>
          </ResponsiveContainer>
        </ChartCard>

        <ChartCard icon={MapPin} title="توزیع کاربران (شهر)" subtitle="۱۰ شهر برتر" stagger="stagger-2">
          <ResponsiveContainer width="100%" height={220}>
            <PieChart>
              <Pie
                data={data.cityDistribution}
                dataKey="value"
                nameKey="name"
                cx="50%"
                cy="50%"
                innerRadius={50}
                outerRadius={80}
                paddingAngle={2}
                label={({ name, value }: { name?: string; value?: number }) => `${name ?? ""} (${toPersianDigits(value ?? 0)})`}
                labelLine={false}
              >
                {data.cityDistribution.map((_, i) => (
                  <Cell key={i} fill={PIE_COLORS[i % PIE_COLORS.length]} stroke="none" />
                ))}
              </Pie>
              <Tooltip content={<CustomTooltip />} />
            </PieChart>
          </ResponsiveContainer>
        </ChartCard>
      </div>

      {/* ردیف پنجم: جنسیت + سن */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
        <ChartCard icon={Users} title="توزیع جنسیت" subtitle="کاربران فعال" stagger="stagger-1">
          <ResponsiveContainer width="100%" height={220}>
            <RadialBarChart
              innerRadius="35%"
              outerRadius="90%"
              data={data.genderDistribution}
              startAngle={90}
              endAngle={-270}
            >
              <RadialBar background dataKey="value" cornerRadius={10}>
                {data.genderDistribution.map((_, i) => (
                  <Cell key={i} fill={GENDER_COLORS[i % GENDER_COLORS.length]} />
                ))}
              </RadialBar>
              <Legend iconType="circle" layout="horizontal" verticalAlign="bottom" align="center" wrapperStyle={{ fontSize: 11 }} />
              <Tooltip content={<CustomTooltip />} />
            </RadialBarChart>
          </ResponsiveContainer>
        </ChartCard>

        <ChartCard icon={Activity} title="توزیع سنی کاربران" subtitle="بازه های سنی" stagger="stagger-2">
          <ResponsiveContainer width="100%" height={220}>
            <BarChart data={data.ageDistribution} layout="vertical">
              <defs>
                <linearGradient id="gradAge" x1="0" y1="0" x2="1" y2="0">
                  <stop offset="0%" stopColor="#8b5cf6" stopOpacity={1} />
                  <stop offset="100%" stopColor="#a855f7" stopOpacity={0.5} />
                </linearGradient>
              </defs>
              <CartesianGrid strokeDasharray="3 3" stroke="#2a2a2a" horizontal={false} />
              <XAxis type="number" tick={{ fontSize: 9 }} allowDecimals={false} stroke="#8e8e8e" />
              <YAxis type="category" dataKey="name" tick={{ fontSize: 10 }} stroke="#8e8e8e" width={60} />
              <Tooltip content={<CustomTooltip />} cursor={{ fill: "rgba(139,92,246,0.05)" }} />
              <Bar dataKey="value" fill="url(#gradAge)" name="کاربران" radius={[0, 6, 6, 0]} />
            </BarChart>
          </ResponsiveContainer>
        </ChartCard>
      </div>

      {/* ردیف ششم: درآمد بر اساس نوع تراکنش */}
      {data.revenueByType.length > 0 && (
        <ChartCard icon={BarChart3} title="درآمد بر اساس نوع تراکنش" subtitle="کل درآمد — تفکیک شده" className="w-full" stagger="stagger-1">
          <ResponsiveContainer width="100%" height={220}>
            <BarChart data={data.revenueByType}>
              <defs>
                <linearGradient id="gradRevType" x1="0" y1="0" x2="0" y2="1">
                  <stop offset="0%" stopColor="#6366f1" stopOpacity={1} />
                  <stop offset="100%" stopColor="#6366f1" stopOpacity={0.3} />
                </linearGradient>
              </defs>
              <CartesianGrid strokeDasharray="3 3" stroke="#2a2a2a" />
              <XAxis dataKey="name" tick={{ fontSize: 10 }} stroke="#8e8e8e" />
              <YAxis tick={{ fontSize: 9 }} stroke="#8e8e8e" tickFormatter={(v) => v >= 1000000 ? `${(v / 1000000).toFixed(1)}م` : v >= 1000 ? `${(v / 1000).toFixed(0)}ه` : v} />
              <Tooltip content={<CustomTooltip formatter={(v) => formatToman(v)} />} cursor={{ fill: "rgba(99,102,241,0.05)" }} />
              <Bar dataKey="value" fill="url(#gradRevType)" name="درآمد" radius={[6, 6, 0, 0]} />
            </BarChart>
          </ResponsiveContainer>
        </ChartCard>
      )}
    </div>
  );
}
