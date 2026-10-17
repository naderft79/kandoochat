// کاتالوگ قالب های بصری برندها — هر قالب مجموعه کامل توکن های شکل/سایه/گرادیانت است
// برند جدید فقط با فیلد theme در brands.json یکی از این ها را می گیرد
import type { BrandConfig } from "@/lib/brands";

export type BrandThemeId = "kandoo" | "aurora" | "flame" | "voyage";
export type BrandAuthLayout = "kandoo" | "card" | "hero" | "split";
export type BrandOnboardingStyle = "kandoo" | "bubble" | "banner" | "clean";
export type BrandNavIndicator = "none" | "pill" | "bar" | "dot";
export type BrandMonogramStyle = "bee" | "glow" | "flame" | "path";

export type BrandTheme = {
  id: BrandThemeId;
  radiusCard: string;
  radiusButton: string;
  radiusInput: string;
  // بابل چت — گوشه ها برای RTL مرتب است
  radiusBubbleMine: string;
  radiusBubbleTheirs: string;
  radiusSheet: string;
  shadowCard: string;
  shadowButton: string;
  shadowModal: string;
  gradientPrimary: string;
  gradientSoft: string;
  gradientHero: string;
  navIndicator: BrandNavIndicator;
  authLayout: BrandAuthLayout;
  onboardingStyle: BrandOnboardingStyle;
  headlineWeight: 700 | 800 | 900;
  monogramStyle: BrandMonogramStyle;
};

export const BRAND_THEMES: Record<BrandThemeId, BrandTheme> = {
  // دقیقاً مقادیر فعلی — صفر تغییر بصری برای کندو
  kandoo: {
    id: "kandoo",
    radiusCard: "12px",
    radiusButton: "8px",
    radiusInput: "8px",
    radiusBubbleMine: "24px 24px 8px 24px",
    radiusBubbleTheirs: "24px 24px 24px 8px",
    radiusSheet: "16px",
    shadowCard: "0 1px 3px rgba(0,0,0,0.08)",
    shadowButton: "none",
    shadowModal: "0 8px 30px rgba(0,0,0,0.12)",
    gradientPrimary: "linear-gradient(135deg,#0074c7,#0095f6)",
    gradientSoft: "linear-gradient(135deg,#ffffff,#fafafa)",
    gradientHero: "linear-gradient(135deg,#0074c7,#0095f6)",
    navIndicator: "none",
    authLayout: "kandoo",
    onboardingStyle: "kandoo",
    headlineWeight: 800,
    monogramStyle: "bee",
  },
  // نفس چت — لطیف و رمانتیک (بنفش-سرخابی، گوشه های خیلی گرد)
  aurora: {
    id: "aurora",
    radiusCard: "24px",
    radiusButton: "999px",
    radiusInput: "14px",
    radiusBubbleMine: "22px 22px 6px 22px",
    radiusBubbleTheirs: "22px 22px 22px 6px",
    radiusSheet: "24px",
    shadowCard: "0 8px 30px rgba(139,92,246,0.14)",
    shadowButton: "0 6px 20px rgba(139,92,246,0.35)",
    shadowModal: "0 20px 60px rgba(109,40,217,0.25)",
    gradientPrimary: "linear-gradient(135deg,#8b5cf6,#ec4899)",
    gradientSoft: "linear-gradient(135deg,#faf7ff,#fdf2f8)",
    gradientHero: "linear-gradient(160deg,#8b5cf6 0%,#a855f7 45%,#ec4899 100%)",
    navIndicator: "pill",
    authLayout: "card",
    onboardingStyle: "bubble",
    headlineWeight: 900,
    monogramStyle: "glow",
  },
  // هم فاز چت — پرانرژی و عاشقانه (گرادیانت گرم قرمز-نارنجی)
  flame: {
    id: "flame",
    radiusCard: "14px",
    radiusButton: "12px",
    radiusInput: "10px",
    radiusBubbleMine: "18px 18px 4px 18px",
    radiusBubbleTheirs: "18px 18px 18px 4px",
    radiusSheet: "20px",
    shadowCard: "0 4px 20px rgba(225,29,72,0.12)",
    shadowButton: "0 8px 24px rgba(225,29,72,0.4)",
    shadowModal: "0 16px 50px rgba(159,18,57,0.3)",
    gradientPrimary: "linear-gradient(135deg,#e11d48,#f97316)",
    gradientSoft: "linear-gradient(135deg,#fff5f5,#fff7ed)",
    gradientHero: "linear-gradient(150deg,#e11d48 0%,#f43f5e 50%,#fb923c 100%)",
    navIndicator: "bar",
    authLayout: "hero",
    onboardingStyle: "banner",
    headlineWeight: 900,
    monogramStyle: "flame",
  },
  // هم مسیر چت — تازه و طبیعی (فیروزه، فضای تمیز)
  voyage: {
    id: "voyage",
    radiusCard: "16px",
    radiusButton: "16px",
    radiusInput: "12px",
    radiusBubbleMine: "20px 20px 8px 20px",
    radiusBubbleTheirs: "20px 20px 20px 8px",
    radiusSheet: "20px",
    shadowCard: "0 2px 12px rgba(13,148,136,0.10)",
    shadowButton: "0 4px 14px rgba(13,148,136,0.3)",
    shadowModal: "0 12px 40px rgba(17,94,89,0.22)",
    gradientPrimary: "linear-gradient(135deg,#0d9488,#06b6d4)",
    gradientSoft: "linear-gradient(135deg,#f0fdfa,#ecfeff)",
    gradientHero: "linear-gradient(140deg,#0d9488 0%,#14b8a6 55%,#22d3ee 100%)",
    navIndicator: "dot",
    authLayout: "split",
    onboardingStyle: "clean",
    headlineWeight: 800,
    monogramStyle: "path",
  },
};

export function getBrandTheme(brand: Pick<BrandConfig, "theme">): BrandTheme {
  return BRAND_THEMES[brand.theme as BrandThemeId] ?? BRAND_THEMES.kandoo;
}

// نگاشت تم + پالت برند به متغیرهای CSS — برای تزریق روی <html> در layout
export function brandCssVars(brand: BrandConfig, theme: BrandTheme): Record<string, string> {
  const c = brand.colors;
  const secondary = c.secondary ?? c.dark;
  return {
    "--brand-gold": c.primary,
    "--brand-gold-light": c.light,
    "--brand-gold-dark": c.dark,
    "--brand-secondary": secondary,
    "--brand-surface-tint": c.surfaceTint ?? "#fafafa",
    // پس زمینه خاکستری رابط هم به رنگ برند گرایش می گیرد — برای کندو همان #fafafa
    "--ig-gray-bg": c.surfaceTint ?? "#fafafa",
    "--color-ig-blue": c.primary,
    "--color-ig-blue-hover": c.dark,
    "--color-ig-blue-bright": c.light,
    "--brand-radius-card": theme.radiusCard,
    "--brand-radius-btn": theme.radiusButton,
    "--brand-radius-input": theme.radiusInput,
    "--brand-radius-bubble-mine": theme.radiusBubbleMine,
    "--brand-radius-bubble-theirs": theme.radiusBubbleTheirs,
    "--brand-radius-sheet": theme.radiusSheet,
    "--brand-shadow-card": theme.shadowCard,
    "--brand-shadow-btn": theme.shadowButton,
    "--brand-shadow-modal": theme.shadowModal,
    "--brand-gradient-primary": theme.gradientPrimary,
    "--brand-gradient-soft": theme.gradientSoft,
    "--brand-gradient-hero": theme.gradientHero,
    "--brand-headline-weight": String(theme.headlineWeight),
  };
}

// قواعد حالت تاریک هر برند — در بلوک <style> جدا تزریق می شود (فقط برندهای غیرکندو)
export function brandDarkCss(brand: BrandConfig): string {
  if (brand.id === "kandoo") return "";
  const c = brand.colors;
  const accent = c.darkAccent ?? c.light;
  const tint = c.darkSurfaceTint ?? "#121212";
  return `html[data-brand="${brand.id}"].dark{--brand-gold:${accent};--brand-gold-light:${c.light};--color-ig-blue:${accent};--color-ig-blue-hover:${c.primary};--color-ig-blue-bright:${c.light};--ig-gray-bg:${tint};--brand-surface-tint:${tint};--brand-shadow-card:0 8px 30px rgba(0,0,0,0.5);--brand-shadow-btn:0 6px 20px rgba(0,0,0,0.4)}`;
}
