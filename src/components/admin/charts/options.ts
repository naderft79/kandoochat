// سازنده گزینه های نمودار: نمودارهای محوری (خط، ناحیه، ستونی) با یک استایل یکسان طلایی برند، و دونات با طرح خاص
// همه با فونت سایت، پالت تم (روشن/تاریک) و انیمیشن نرم؛ در حالت کاهش حرکت انیمیشن خاموش است
import type { EChartsCoreOption } from "echarts/core";
import type { ChartPalette } from "@/components/admin/charts/palette";
import { toPersianDigits } from "@/lib/format";

export type SeriesKind = "line" | "area" | "bar";

// سری اول با رنگ اصلی طلایی و سری دوم با طلایی روشن رسم می شود (هیچ رنگ دیگری در نمودارهای محوری نیست)
export type CartesianSeries = {
  name: string;
  data: number[];
  kind: SeriesKind;
};

type CartesianArgs = {
  categories: string[];
  series: CartesianSeries[];
  horizontal?: boolean;
  valueFormatter?: (v: number) => string;
  // قالب کوتاه برای برچسب های محور مقداری (مثلاً ۱٫۲م)؛ در تولتیپ همان valueFormatter کامل استفاده می شود
  axisFormatter?: (v: number) => string;
  // نمایش عدد روی ستون ها (برای نمودارهای رتبه ای مثل قیف و استان ها)
  showValues?: boolean;
};

// قالب کوتاه محور: ۱٫۲م، ۴۵ه، ۸۰۰ (فارسی)
export const compactFa = (v: number) => {
  const abs = Math.abs(v);
  const txt = abs >= 1_000_000 ? `${(v / 1_000_000).toFixed(1)}م` : abs >= 1_000 ? `${(v / 1_000).toFixed(0)}ه` : String(Math.round(v));
  return toPersianDigits(txt);
};

// افزودن شفافیت به کد هگزا (۶ رقمی) برای گرادیان ناحیه و ستون
const withAlpha = (hex: string, alpha: string) => (hex.length === 7 ? `${hex}${alpha}` : hex);

export function cartesianOption(p: ChartPalette, args: CartesianArgs): EChartsCoreOption {
  const { categories, series, horizontal = false, valueFormatter, axisFormatter, showValues = false } = args;
  const fmt = (v: unknown) => (valueFormatter ? valueFormatter(Number(v)) : String(v));
  const axisFmt = (v: unknown) => {
    const f = axisFormatter ?? valueFormatter;
    return f ? f(Number(v)) : String(v);
  };
  const showLegend = series.length > 1;
  const font = { fontFamily: p.fontFamily };
  const colorOf = (i: number) => (i === 0 ? p.primary : p.secondary);

  return {
    animation: p.motion,
    animationDuration: 900,
    animationEasing: "cubicOut",
    textStyle: font,
    grid: { left: 4, right: 14, top: showLegend ? 40 : 18, bottom: 6, containLabel: true },
    legend: showLegend
      ? {
          top: 0,
          right: 0,
          itemWidth: 10,
          itemHeight: 10,
          icon: "roundRect",
          textStyle: { ...font, color: p.subText, fontSize: 11 },
        }
      : undefined,
    tooltip: {
      trigger: "axis",
      backgroundColor: p.tooltipBg,
      borderColor: p.tooltipBorder,
      borderWidth: 1,
      padding: [8, 12],
      extraCssText: "border-radius:12px;box-shadow:0 8px 24px rgba(0,0,0,0.25);",
      textStyle: { ...font, color: p.text, fontSize: 12 },
      axisPointer: { type: horizontal ? "shadow" : "line", lineStyle: { color: p.grid, width: 1.5 }, shadowStyle: { color: p.grid } },
      valueFormatter: (v: unknown) => fmt(v),
    },
    xAxis: horizontal
      ? {
          type: "value",
          splitLine: { lineStyle: { color: p.grid } },
          axisLabel: { ...font, color: p.subText, fontSize: 10, formatter: (v: number) => axisFmt(v) },
        }
      : {
          type: "category",
          data: categories,
          boundaryGap: series.every((s) => s.kind === "bar"),
          axisLine: { show: false },
          axisTick: { show: false },
          axisLabel: { ...font, color: p.subText, fontSize: 10, hideOverlap: true, margin: 12 },
        },
    yAxis: horizontal
      ? {
          type: "category",
          data: categories,
          inverse: true,
          axisLine: { show: false },
          axisTick: { show: false },
          axisLabel: { ...font, color: p.text, fontSize: 11 },
        }
      : {
          type: "value",
          splitLine: { lineStyle: { color: p.grid, type: "dashed" } },
          axisLabel: { ...font, color: p.subText, fontSize: 10, formatter: (v: number) => axisFmt(v) },
        },
    series: series.map((s, i) => {
      const color = colorOf(i);
      const base = {
        name: s.name,
        data: s.data,
        emphasis: { focus: "series" as const },
        label: showValues
          ? { show: true, position: horizontal ? "right" : "top", color: p.text, fontSize: 10, ...font, formatter: (x: { value: unknown }) => fmt(x.value) }
          : { show: false },
      };
      if (s.kind === "bar") {
        return {
          ...base,
          type: "bar",
          barMaxWidth: 18,
          itemStyle: {
            borderRadius: horizontal ? [0, 6, 6, 0] : [6, 6, 0, 0],
            color: {
              type: "linear",
              x: 0,
              y: 0,
              x2: horizontal ? 1 : 0,
              y2: horizontal ? 0 : 1,
              colorStops: [
                { offset: 0, color },
                { offset: 1, color: withAlpha(color, "77") },
              ],
            },
          },
        };
      }
      return {
        ...base,
        type: "line",
        smooth: true,
        showSymbol: false,
        symbolSize: 6,
        lineStyle: { width: 2.5, color },
        itemStyle: { color },
        areaStyle:
          s.kind === "area"
            ? {
                color: {
                  type: "linear",
                  x: 0,
                  y: 0,
                  x2: 0,
                  y2: 1,
                  colorStops: [
                    { offset: 0, color: withAlpha(color, "59") },
                    { offset: 1, color: withAlpha(color, "00") },
                  ],
                },
              }
            : undefined,
      };
    }),
  };
}

// دونات با طرح خاص: حلقه ضخیم با گوشه گرد، مجموع در مرکز با فونت سایت، و فهرست در کنار
export function donutOption(
  p: ChartPalette,
  data: { name: string; value: number }[],
  valueFormatter?: (v: number) => string
): EChartsCoreOption {
  const total = data.reduce((sum, d) => sum + d.value, 0);
  const font = { fontFamily: p.fontFamily };
  return {
    animation: p.motion,
    animationDuration: 900,
    color: p.series,
    textStyle: font,
    tooltip: {
      trigger: "item",
      backgroundColor: p.tooltipBg,
      borderColor: p.tooltipBorder,
      textStyle: { ...font, color: p.text, fontSize: 12 },
      extraCssText: "border-radius:12px;",
      valueFormatter: (v: unknown) => (valueFormatter ? valueFormatter(Number(v)) : String(v)),
    },
    legend: {
      type: "scroll",
      orient: "vertical",
      right: 0,
      top: "middle",
      itemWidth: 10,
      itemHeight: 10,
      icon: "circle",
      textStyle: { ...font, color: p.text, fontSize: 11 },
      pageTextStyle: { ...font, color: p.subText },
    },
    series: [
      {
        type: "pie",
        radius: ["52%", "78%"],
        center: ["34%", "50%"],
        avoidLabelOverlap: true,
        itemStyle: { borderRadius: 8, borderColor: p.bg, borderWidth: 3 },
        label: {
          show: true,
          position: "center",
          formatter: () => `{v|${toPersianDigits(String(total))}}\n{t|مجموع}`,
          rich: {
            v: { ...font, fontSize: 18, fontWeight: 800, color: p.text, lineHeight: 24 },
            t: { ...font, fontSize: 10, color: p.subText },
          },
        },
        emphasis: { scale: true, scaleSize: 6, label: { show: true } },
        labelLine: { show: false },
        data,
      },
    ],
  };
}
