"use client";

// داشبورد آمار بازدید: اعداد با انیمیشن شمارش، نمودار روند روزانه، منابع ورود (موتور جستجو و شبکه اجتماعی)، و آمار هر صفحه
import { useEffect, useMemo, useRef, useState } from "react";
import { animate, motion, useReducedMotion } from "framer-motion";
import { Globe, Search, Share2, Smartphone, Loader2, RefreshCw, FileText, Megaphone, Link2, ArrowDownToLine } from "lucide-react";
import { toPersianDigits } from "@/lib/format";
import EChart from "@/components/admin/charts/EChart";
import { useChartPalette, type ChartPalette } from "@/components/admin/charts/palette";
import { cartesianOption, donutOption, compactFa } from "@/components/admin/charts/options";
import { useJson } from "@/components/admin/user-modal/useJson";
import type { VisitsRange } from "@/lib/visits";

type Report = {
  range: VisitsRange;
  kpis: Record<string, number>;
  daily: { day: string; label: string; views: number; visitors: number; visits: number }[];
  pages: { key: string; name: string; views: number }[];
  searchSources: { key: string; name: string; visits: number }[];
  socialSources: { key: string; name: string; visits: number }[];
  channels: { key: string; name: string; visits: number }[];
  platforms: { key: string; name: string; views: number }[];
};

const RANGES: { days: VisitsRange; label: string }[] = [
  { days: 7, label: "۷ روز" },
  { days: 30, label: "۳۰ روز" },
  { days: 90, label: "۹۰ روز" },
];

const fa = (n: number) => toPersianDigits(Math.round(n).toLocaleString("en-US").replace(/,/g, "،"));

// عدد با انیمیشن شمارش؛ در حالت کاهش حرکت بلافاصله مقدار نهایی نشان داده می شود
function CountUp({ value, className = "" }: { value: number; className?: string }) {
  const reduced = useReducedMotion();
  const [display, setDisplay] = useState(0);
  const lastRef = useRef(0);

  useEffect(() => {
    const from = lastRef.current;
    lastRef.current = value;
    // در حالت کاهش حرکت مدت انیمیشن صفر است اما به روزرسانی همچنان از طریق کالبک انجام می شود
    const controls = animate(from, value, {
      duration: reduced ? 0 : 0.9,
      ease: "easeOut",
      onUpdate: (v) => setDisplay(v),
    });
    return () => controls.stop();
  }, [value, reduced]);

  return <span className={className}>{fa(display)}</span>;
}

function Card({ title, subtitle, icon: Icon, children, className = "" }: { title: string; subtitle?: string; icon: typeof Globe; children: React.ReactNode; className?: string }) {
  return (
    <motion.div
      initial={{ opacity: 0, y: 12 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.45, ease: "easeOut" }}
      className={`lux-card p-5 ${className}`}
    >
      <div className="flex items-center gap-2 mb-3">
        <div className="w-8 h-8 rounded-lg bg-[rgba(212,175,55,0.08)] border border-[rgba(212,175,55,0.15)] flex items-center justify-center">
          <Icon className="w-4 h-4 text-[#d4af37]" strokeWidth={2} aria-hidden />
        </div>
        <div>
          <h3 className="text-sm font-bold text-foreground">{title}</h3>
          {subtitle && <p className="text-[10px] text-[#888]">{subtitle}</p>}
        </div>
      </div>
      {children}
    </motion.div>
  );
}

function KpiCard({ label, value, hint, delay }: { label: string; value: number; hint?: string; delay: number }) {
  return (
    <motion.div
      initial={{ opacity: 0, scale: 0.96 }}
      animate={{ opacity: 1, scale: 1 }}
      transition={{ delay, duration: 0.4, ease: "easeOut" }}
      className="lux-card p-4"
    >
      <p className="text-[11px] text-[#888] font-bold">{label}</p>
      <p className="text-xl font-black text-foreground mt-1">
        <CountUp value={value} />
      </p>
      {hint && <p className="text-[10px] text-[#888] mt-1">{hint}</p>}
    </motion.div>
  );
}

// نوار افقی انیمیشنی برای رتبه بندی صفحات و منابع
function Bars({ rows, max, color }: { rows: { key: string; name: string; value: number; sub?: string }[]; max: number; color: string }) {
  if (rows.length === 0) return <p className="text-xs text-[#888] py-6 text-center">داده ای برای این بازه ثبت نشده است</p>;
  return (
    <ul className="space-y-2.5">
      {rows.map((r, i) => {
        const pct = max > 0 ? Math.max(3, (r.value / max) * 100) : 0;
        return (
          <li key={r.key}>
            <div className="flex items-center justify-between gap-2 text-xs mb-1">
              <span className="font-bold text-foreground truncate">{r.name}</span>
              <span className="text-[#888] shrink-0">
                {fa(r.value)}
                {r.sub && <span className="mr-1">({r.sub})</span>}
              </span>
            </div>
            <div className="h-2 rounded-full bg-[rgba(212,175,55,0.08)] overflow-hidden">
              <motion.div
                initial={{ width: 0 }}
                animate={{ width: `${pct}%` }}
                transition={{ delay: 0.1 + i * 0.04, duration: 0.7, ease: "easeOut" }}
                className="h-full rounded-full"
                style={{ background: color }}
              />
            </div>
          </li>
        );
      })}
    </ul>
  );
}

function buildCharts(p: ChartPalette, r: Report) {
  const labels = r.daily.map((d) => d.label);
  return {
    daily: cartesianOption(p, {
      categories: labels,
      series: [
        { name: "بازدید صفحه", kind: "area", data: r.daily.map((d) => d.views) },
        { name: "ورود نشست", kind: "line", data: r.daily.map((d) => d.visits) },
      ],
      valueFormatter: (v) => fa(v),
      axisFormatter: compactFa,
    }),
    channels: donutOption(p, r.channels.filter((c) => c.visits > 0).map((c) => ({ name: c.name, value: c.visits })), (v) => fa(v)),
    platforms: donutOption(p, r.platforms.filter((c) => c.views > 0).map((c) => ({ name: c.name, value: c.views })), (v) => fa(v)),
  };
}

export default function VisitsDashboard() {
  const [range, setRange] = useState<VisitsRange>(30);
  const palette = useChartPalette();
  const { data, error, loading, reload } = useJson<Report>(`/api/admin/visits?range=${range}`);

  // بازخوانی خودکار هر ۳۰ ثانیه مثل بقیه آمارهای زنده پنل
  useEffect(() => {
    const id = setInterval(reload, 30_000);
    return () => clearInterval(id);
  }, [reload]);

  const charts = useMemo(() => (data ? buildCharts(palette, data) : null), [data, palette]);
  const k = data?.kpis;
  const pageMax = data?.pages[0]?.views ?? 0;
  const searchRows = (data?.searchSources ?? []).map((s) => ({ key: s.key, name: s.name, value: s.visits }));
  const socialRows = (data?.socialSources ?? []).map((s) => ({ key: s.key, name: s.name, value: s.visits }));
  const pageRows = (data?.pages ?? []).map((p) => ({
    key: p.key,
    name: p.name,
    value: p.views,
    sub: data && data.kpis.views > 0 ? `${toPersianDigits(Math.round((p.views / data.kpis.views) * 100))}٪` : undefined,
  }));

  return (
    <div className="space-y-5 mt-2">
      <div className="flex flex-wrap items-center justify-between gap-3">
        <div className="flex gap-1.5 p-1 rounded-xl bg-[rgba(212,175,55,0.06)] border border-[rgba(212,175,55,0.12)] relative" role="tablist" aria-label="بازه زمانی">
          {RANGES.map((r) => (
            <button
              key={r.days}
              type="button"
              role="tab"
              aria-selected={range === r.days}
              onClick={() => setRange(r.days)}
              className={`relative px-3 py-1.5 rounded-lg text-xs font-bold transition-colors ${range === r.days ? "text-[#d4af37]" : "text-[#888] hover:text-[#d4af37]"}`}
            >
              {range === r.days && (
                <motion.span
                  layoutId="visits-range-pill"
                  className="absolute inset-0 rounded-lg bg-[rgba(212,175,55,0.18)] border border-[rgba(212,175,55,0.3)]"
                  transition={{ type: "spring", stiffness: 380, damping: 32 }}
                />
              )}
              <span className="relative">{r.label}</span>
            </button>
          ))}
        </div>
        <button type="button" onClick={reload} className="px-3 py-1.5 rounded-lg lux-btn-outline text-xs font-bold flex items-center gap-1.5">
          <RefreshCw className="w-3.5 h-3.5" aria-hidden />
          بروزرسانی
        </button>
      </div>

      {loading && !data && (
        <div className="flex justify-center py-16">
          <Loader2 className="w-7 h-7 text-[rgba(212,175,55,0.6)] animate-spin" aria-label="در حال بارگذاری" />
        </div>
      )}
      {error && !data && <p className="text-sm text-[#f87171] text-center py-10">{error}</p>}

      {data && k && charts && (
        <>
          <div className="grid grid-cols-2 lg:grid-cols-4 gap-3">
            <KpiCard label="بازدید صفحات" value={k.views} delay={0} hint="همه صفحه ها" />
            <KpiCard label="بازدیدکننده یکتا" value={k.visitors} hint="جمع روزانه (هش یکتای روزانه)" delay={0.05} />
            <KpiCard label="ورود نشست ها" value={k.visits} hint="اولین صفحه هر نشست" delay={0.1} />
            <KpiCard label="بازدید اپلیکیشن" value={k.appViews} hint={`وب: ${fa(k.webViews)}`} delay={0.15} />
            <KpiCard label="ورود از موتور جستجو" value={k.searchVisits} delay={0.2} />
            <KpiCard label="ورود از شبکه اجتماعی" value={k.socialVisits} delay={0.25} />
            <KpiCard label="ورود از تبلیغات" value={k.paidVisits} delay={0.3} />
            <KpiCard label="ورود مستقیم" value={k.directVisits} delay={0.35} />
          </div>

          <Card title="روند بازدید روزانه" subtitle={`${fa(range)} روز اخیر — بازدید صفحه و ورود نشست`} icon={Globe}>
            <EChart label="نمودار روند بازدید روزانه" option={charts.daily} height={280} />
          </Card>

          <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
            <Card title="ورودی های موتور جستجو" subtitle="نشست هایی که از موتور جستجو آمده اند" icon={Search}>
              <Bars rows={searchRows} max={Math.max(0, ...searchRows.map((r) => r.value))} color={palette.primary} />
            </Card>
            <Card title="ورودی های شبکه اجتماعی" subtitle="اینستاگرام، تلگرام و سایر شبکه ها (شامل مرورگر داخلی اپ)" icon={Share2}>
              <Bars rows={socialRows} max={Math.max(0, ...socialRows.map((r) => r.value))} color={palette.secondary} />
            </Card>
          </div>

          <div className="grid grid-cols-1 lg:grid-cols-3 gap-4">
            <Card title="منبع ورود" subtitle="سهم هر کانال از نشست ها" icon={ArrowDownToLine} className="lg:col-span-1">
              <EChart label="نمودار منبع ورود" option={charts.channels} height={240} />
            </Card>
            <Card title="پلتفرم بازدید" subtitle="وب در برابر اپلیکیشن اندروید" icon={Smartphone} className="lg:col-span-1">
              <EChart label="نمودار پلتفرم بازدید" option={charts.platforms} height={240} />
            </Card>
            <Card title="خلاصه ورودها" subtitle="تفکیک بر اساس کانال" icon={Link2} className="lg:col-span-1">
              <ul className="space-y-2">
                {data.channels.map((c) => (
                  <li key={c.key} className="flex items-center justify-between text-xs">
                    <span className="text-foreground font-bold">{c.name}</span>
                    <span className="text-[#d4af37] font-black">{fa(c.visits)}</span>
                  </li>
                ))}
              </ul>
              <p className="text-[10px] text-[#888] mt-3">
                ورودی هر نشست اولین صفحه‌ای است که کاربر در یک تب مرورگر باز می‌کند؛ بازدیدهای بعدی همان نشست داخلی هستند.
              </p>
            </Card>
          </div>

          <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
            <Card title="بازدید هر صفحه" subtitle="پرتکرارترین صفحات سایت (با نام)" icon={FileText}>
              <Bars rows={pageRows.slice(0, 12)} max={pageMax} color={palette.primary} />
            </Card>
            <Card title="منابع ورود (همه)" subtitle="منابع ورود نشست ها به تفکیک نام" icon={Megaphone}>
              <Bars
                rows={[...searchRows, ...socialRows, ...(data.channels.find((c) => c.key === "REFERRAL") ? [{ key: "REFERRAL", name: "ارجاع از سایت ها", value: data.channels.find((c) => c.key === "REFERRAL")!.visits }] : [])].sort((a, b) => b.value - a.value).slice(0, 12)}
                max={Math.max(0, ...searchRows.map((r) => r.value), ...socialRows.map((r) => r.value))}
                color={palette.secondary}
              />
            </Card>
          </div>

          <Card title="جدول بازدید صفحات" subtitle="همه صفحات با نام، تعداد بازدید و سهم" icon={FileText}>
            {/* گرید با ستون های ثابت — نام و آدرس در یک ستون، عدد و سهم در ستون های تراز شده */}
            <div className="overflow-x-auto">
              <div className="min-w-[460px]">
                <div className="grid grid-cols-[minmax(0,1fr)_72px_140px] gap-3 items-center text-[10px] font-bold text-[#888] border-b border-[rgba(212,175,55,0.12)] pb-2">
                  <span>صفحه</span>
                  <span className="text-center">بازدید</span>
                  <span>سهم از کل</span>
                </div>
                {data.pages.map((p, i) => {
                  const share = data.kpis.views > 0 ? (p.views / data.kpis.views) * 100 : 0;
                  return (
                    <div
                      key={p.key}
                      className="grid grid-cols-[minmax(0,1fr)_72px_140px] gap-3 items-center py-2.5 border-b border-[rgba(212,175,55,0.06)] last:border-0"
                    >
                      <div className="min-w-0">
                        <p className="text-xs font-bold text-foreground truncate">{p.name}</p>
                        <p className="text-[10px] text-[#888] truncate mt-0.5" dir="ltr">{p.key}</p>
                      </div>
                      <p className="text-xs font-black text-[#d4af37] text-center">
                        <CountUp value={p.views} />
                      </p>
                      <div className="flex items-center gap-2" dir="ltr">
                        <div className="h-1.5 flex-1 rounded-full bg-[rgba(212,175,55,0.08)] overflow-hidden">
                          <motion.div
                            initial={{ width: 0 }}
                            animate={{ width: `${Math.max(2, share)}%` }}
                            transition={{ delay: 0.05 * i, duration: 0.6, ease: "easeOut" }}
                            className="h-full rounded-full bg-[#d4af37]"
                          />
                        </div>
                        <span className="text-[10px] text-[#888] w-9 text-left shrink-0">{fa(Math.round(share))}٪</span>
                      </div>
                    </div>
                  );
                })}
              </div>
            </div>
          </Card>
        </>
      )}
    </div>
  );
}
