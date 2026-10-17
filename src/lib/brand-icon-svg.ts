// مشخصات مشترک مونوگرام برند — هم در روت آیکون وب و هم در اسکریپت تولید اندروید استفاده می شود
// مونوگرام = حرف اول نام برند + گرادیانت رنگی + المان تزئینی قالب
import type { BrandConfig } from "@/lib/brands";
import type { BrandTheme } from "@/lib/brand-theme";

export type MonogramSpec = {
  letter: string;
  primary: string;
  secondary: string;
  // نسبت گردی گوشه به اندازه (0..0.5)
  radiusRatio: number;
  deco: "glow" | "flame" | "path" | "none";
};

export function getMonogramSpec(brand: BrandConfig, theme: BrandTheme): MonogramSpec {
  return {
    letter: brand.iconLetter?.trim() || brand.name.trim()[0] || "ک",
    primary: brand.colors.primary,
    secondary: brand.colors.secondary ?? brand.colors.dark,
    radiusRatio:
      theme.monogramStyle === "glow" ? 0.5 : theme.monogramStyle === "flame" ? 0.28 : 0.22,
    deco:
      theme.monogramStyle === "bee"
        ? "none"
        : (theme.monogramStyle as MonogramSpec["deco"]),
  };
}

// SVG مونوگرام — برای تولید آیکون اندروید با sharp و هر جایی که فایل SVG لازم باشد
export function monogramSvg(spec: MonogramSpec, px: number, opts?: { maskable?: boolean; transparent?: boolean }) {
  const r = px * spec.radiusRatio;
  const safe = opts?.maskable ? 0.42 : 0.52; // در نسخه maskable حرف کوچک تر می شود
  const fontSize = Math.round(px * safe);
  const deco =
    spec.deco === "glow"
      ? `<circle cx="${px / 2}" cy="${px / 2}" r="${px * 0.36}" fill="#ffffff" opacity="0.22"/>`
      : spec.deco === "flame"
        ? `<path d="M ${px * 0.2} ${px * 0.78} Q ${px * 0.5} ${px * 0.6} ${px * 0.8} ${px * 0.78}" stroke="#ffffff" stroke-width="${px * 0.03}" fill="none" opacity="0.5" stroke-linecap="round"/>`
        : spec.deco === "path"
          ? `<path d="M ${px * 0.22} ${px * 0.8} C ${px * 0.4} ${px * 0.68}, ${px * 0.6} ${px * 0.68}, ${px * 0.78} ${px * 0.8}" stroke="#ffffff" stroke-width="${px * 0.025}" fill="none" opacity="0.6" stroke-linecap="round" stroke-dasharray="${px * 0.05} ${px * 0.04}"/>`
          : "";
  return `<svg xmlns="http://www.w3.org/2000/svg" width="${px}" height="${px}">
  <defs>
    <linearGradient id="g" x1="0" y1="0" x2="1" y2="1">
      <stop offset="0" stop-color="${spec.primary}"/>
      <stop offset="1" stop-color="${spec.secondary}"/>
    </linearGradient>
  </defs>
  <rect width="${px}" height="${px}" rx="${r}" fill="${opts?.transparent ? "none" : "url(#g)"}"/>
  ${deco}
  <text x="50%" y="54%" text-anchor="middle" dominant-baseline="central"
    font-family="Vazirmatn, Tahoma, Segoe UI, sans-serif" font-size="${fontSize}"
    font-weight="900" fill="#ffffff">${escapeXml(spec.letter)}</text>
</svg>`;
}

// اسپلش: تمام صفحه گرادیانت hero + مونوگرام سفید مرکزی — برای drawable/splash.png هر برند
export function splashSvg(spec: MonogramSpec, width: number, height: number) {
  const icon = Math.round(Math.min(width, height) * 0.34);
  const cx = width / 2;
  const cy = height / 2;
  const fontSize = Math.round(icon * 0.52);
  return `<svg xmlns="http://www.w3.org/2000/svg" width="${width}" height="${height}">
  <defs>
    <linearGradient id="g" x1="0" y1="0" x2="1" y2="1">
      <stop offset="0" stop-color="${spec.primary}"/>
      <stop offset="1" stop-color="${spec.secondary}"/>
    </linearGradient>
  </defs>
  <rect width="${width}" height="${height}" fill="url(#g)"/>
  <circle cx="${cx}" cy="${cy}" r="${icon / 2}" fill="#ffffff" opacity="0.18"/>
  <circle cx="${cx}" cy="${cy}" r="${icon * 0.42}" fill="#ffffff" opacity="0.25"/>
  <text x="${cx}" y="${cy + icon * 0.02}" text-anchor="middle" dominant-baseline="central"
    font-family="Vazirmatn, Tahoma, Segoe UI, sans-serif" font-size="${fontSize}"
    font-weight="900" fill="#ffffff">${escapeXml(spec.letter)}</text>
</svg>`;
}

// آیکون نوتیفیکیشن مونوکروم — فقط حرف سفید روی شفاف؛ سیستم آن را tint می کند
export function notificationSvg(spec: MonogramSpec, px: number) {
  const fontSize = Math.round(px * 0.6);
  return `<svg xmlns="http://www.w3.org/2000/svg" width="${px}" height="${px}">
  <text x="50%" y="54%" text-anchor="middle" dominant-baseline="central"
    font-family="Vazirmatn, Tahoma, Segoe UI, sans-serif" font-size="${fontSize}"
    font-weight="900" fill="#ffffff">${escapeXml(spec.letter)}</text>
</svg>`;
}

export function escapeXml(s: string) {
  return String(s)
    .replaceAll("&", "&amp;")
    .replaceAll("<", "&lt;")
    .replaceAll(">", "&gt;")
    .replaceAll('"', "&quot;")
    .replaceAll("'", "&apos;");
}
