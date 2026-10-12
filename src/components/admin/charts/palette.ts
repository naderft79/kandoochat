"use client";

// پالت و فونت نمودارها برای حالت تاریک (لاکچری طلایی) و روشن؛ انتخاب بر اساس تم فعال next-themes
// فونت: canvas فونت CSS صفحه را به ارث نمی برد، پس نام واقعی فونت سایت (next/font) از body خوانده می شود
import { useMemo, useSyncExternalStore } from "react";
import { useTheme } from "next-themes";

export type ChartPalette = {
  text: string;
  subText: string;
  grid: string;
  bg: string;
  tooltipBg: string;
  tooltipBorder: string;
  primary: string;
  secondary: string;
  series: string[];
  fontFamily: string;
  motion: boolean;
};

// رنگ های دونات (فقط برای دسته های متعدد شهر و جنسیت)
const DARK_SERIES = ["#d4af37", "#34d399", "#60a5fa", "#f87171", "#a78bfa", "#fb923c", "#22d3ee", "#f472b6", "#84cc16", "#f0d264"];
const LIGHT_SERIES = ["#a8861a", "#059669", "#2563eb", "#dc2626", "#7c3aed", "#ea580c", "#0891b2", "#db2777", "#65a30d", "#b45309"];

type BasePalette = Omit<ChartPalette, "motion" | "fontFamily">;

export const DARK_PALETTE: BasePalette = {
  text: "#e8e8e8",
  subText: "#9a9a9a",
  grid: "rgba(212,175,55,0.1)",
  bg: "#12101c",
  tooltipBg: "#141414",
  tooltipBorder: "rgba(212,175,55,0.3)",
  primary: "#d4af37",
  secondary: "#f0d264",
  series: DARK_SERIES,
};

export const LIGHT_PALETTE: BasePalette = {
  text: "#1f1f1f",
  subText: "#5f5f5f",
  grid: "rgba(122,95,15,0.12)",
  bg: "#ffffff",
  tooltipBg: "#ffffff",
  tooltipBorder: "rgba(176,140,30,0.4)",
  primary: "#a8861a",
  secondary: "#d4b24c",
  series: LIGHT_SERIES,
};

const reducedMotionSubscribe = (cb: () => void) => {
  const mq = window.matchMedia("(prefers-reduced-motion: reduce)");
  mq.addEventListener("change", cb);
  return () => mq.removeEventListener("change", cb);
};
const reducedMotionSnapshot = () => window.matchMedia("(prefers-reduced-motion: reduce)").matches;

const fontsSubscribe = (cb: () => void) => {
  document.fonts.addEventListener("loadingdone", cb);
  return () => document.fonts.removeEventListener("loadingdone", cb);
};
// فهرست فونت محاسبه شده body؛ همان فونتی که متن های صفحه با آن نمایش داده می شود
const fontSnapshot = () => getComputedStyle(document.body).fontFamily || "sans-serif";
const fontServerSnapshot = () => "sans-serif";

// پالت فعال: تم روشن یا تاریک + فونت سایت + احترام به تنظیم کاهش حرکت کاربر
export function useChartPalette(): ChartPalette {
  const { resolvedTheme } = useTheme();
  const reduced = useSyncExternalStore(reducedMotionSubscribe, reducedMotionSnapshot, () => false);
  const fontFamily = useSyncExternalStore(fontsSubscribe, fontSnapshot, fontServerSnapshot);
  // ثابت نگه داشتن شیء پالت تا گزینه های نمودار فقط با تغییر تم، فونت یا تنظیم حرکت دوباره ساخته شوند
  return useMemo(() => {
    const base = resolvedTheme === "dark" ? DARK_PALETTE : LIGHT_PALETTE;
    return { ...base, fontFamily, motion: !reduced };
  }, [resolvedTheme, reduced, fontFamily]);
}
