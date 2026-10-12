"use client";

// پالت نمودارها برای حالت تاریک (لاکچری طلایی) و روشن؛ انتخاب بر اساس تم فعال next-themes
import { useMemo, useSyncExternalStore } from "react";
import { useTheme } from "next-themes";

export type ChartPalette = {
  text: string;
  subText: string;
  grid: string;
  bg: string;
  tooltipBg: string;
  tooltipBorder: string;
  series: string[];
  motion: boolean;
};

const DARK_SERIES = ["#d4af37", "#34d399", "#60a5fa", "#f87171", "#a78bfa", "#fb923c", "#22d3ee", "#f472b6", "#84cc16", "#facc15"];
const LIGHT_SERIES = ["#a8861a", "#059669", "#2563eb", "#dc2626", "#7c3aed", "#ea580c", "#0891b2", "#db2777", "#65a30d", "#b45309"];

export const DARK_PALETTE: Omit<ChartPalette, "motion"> = {
  text: "#e8e8e8",
  subText: "#9a9a9a",
  grid: "rgba(212,175,55,0.1)",
  bg: "#12101c",
  tooltipBg: "#141414",
  tooltipBorder: "rgba(212,175,55,0.3)",
  series: DARK_SERIES,
};

export const LIGHT_PALETTE: Omit<ChartPalette, "motion"> = {
  text: "#1f1f1f",
  subText: "#5f5f5f",
  grid: "rgba(122,95,15,0.12)",
  bg: "#ffffff",
  tooltipBg: "#ffffff",
  tooltipBorder: "rgba(176,140,30,0.4)",
  series: LIGHT_SERIES,
};

const reducedMotionSubscribe = (cb: () => void) => {
  const mq = window.matchMedia("(prefers-reduced-motion: reduce)");
  mq.addEventListener("change", cb);
  return () => mq.removeEventListener("change", cb);
};
const reducedMotionSnapshot = () => window.matchMedia("(prefers-reduced-motion: reduce)").matches;

// پالت فعال: تم روشن یا تاریک + احترام به تنظیم کاهش حرکت کاربر
export function useChartPalette(): ChartPalette {
  const { resolvedTheme } = useTheme();
  const reduced = useSyncExternalStore(reducedMotionSubscribe, reducedMotionSnapshot, () => false);
  // ثابت نگه داشتن شیء پالت تا گزینه های نمودار فقط با تغییر تم یا تنظیم حرکت دوباره ساخته شوند
  return useMemo(() => {
    const base = resolvedTheme === "dark" ? DARK_PALETTE : LIGHT_PALETTE;
    return { ...base, motion: !reduced };
  }, [resolvedTheme, reduced]);
}
