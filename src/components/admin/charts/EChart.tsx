"use client";

// کامپوننت عمومی نمودار ECharts: ساخت، تغییر اندازه خودکار، و آزادسازی منابع هنگام خروج
import { useEffect, useRef } from "react";
import { init, type ECharts, type EChartsCoreOption } from "@/components/admin/charts/echarts-core";

type Props = {
  option: EChartsCoreOption;
  height?: number;
  label: string;
  className?: string;
};

export default function EChart({ option, height = 260, label, className = "" }: Props) {
  const containerRef = useRef<HTMLDivElement>(null);
  const chartRef = useRef<ECharts | null>(null);

  // ساخت نمودار یک بار و آزادسازی هنگام unmount (جلوگیری از نشت حافظه)
  useEffect(() => {
    const el = containerRef.current;
    if (!el) return;
    const chart = init(el, undefined, { renderer: "canvas" });
    chartRef.current = chart;
    const observer = new ResizeObserver(() => chart.resize());
    observer.observe(el);
    return () => {
      observer.disconnect();
      chart.dispose();
      chartRef.current = null;
    };
  }, []);

  // به‌روزرسانی گزینه ها (داده، تم، کاهش حرکت) بدون ساخت مجدد نمودار
  useEffect(() => {
    chartRef.current?.setOption(option, { notMerge: true });
  }, [option]);

  return (
    <div
      ref={containerRef}
      role="img"
      aria-label={label}
      className={`w-full ${className}`}
      style={{ height }}
    />
  );
}
