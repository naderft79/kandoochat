// سیستم برند — خواندن کانفیگ برندها از JSON و تشخیص برند/مارکت از User-Agent
// اپ های مارکتی توکن «KandooApp/<brand>.<market>/1.0» در UA می فرستند؛ کندو «KandooApp/1.0»
import brandsConfig from "@/config/brands.json";

export type BrandColors = { primary: string; light: string; dark: string };

export type BrandConfig = {
  id: string;
  name: string;
  nameEn?: string;
  packageName: string;
  uaToken: string;
  slogan: string;
  colors: BrandColors;
  // کلید عمومی RSA تایید خرید هر مارکت — از پنل توسعه دهنده آن مارکت
  iapKeys?: { bazaar?: string; myket?: string };
};

// کندو — برند پیش فرض؛ در JSON نیست و همیشه fallback است
export const DEFAULT_BRAND: BrandConfig = {
  id: "kandoo",
  name: "کندو چت",
  nameEn: "Kandoo Chat",
  packageName: "com.kandoochats.app",
  uaToken: "",
  slogan: "همسریابی",
  // رنگ اکسنت فعلی رابط کاربر (آبی اینستاگرامی) — پنل ادمین طلایی مجزا می ماند
  colors: { primary: "#0074c7", light: "#0095f6", dark: "#005fa3" },
};

export type Market = "bazaar" | "myket";
export const MARKETS: Market[] = ["bazaar", "myket"];

export const BRANDS: BrandConfig[] = (brandsConfig.brands as BrandConfig[]).filter(
  (b) => b.id !== "kandoo"
);

export function getBrandById(id: string | null | undefined): BrandConfig {
  return BRANDS.find((b) => b.id === id) ?? DEFAULT_BRAND;
}

export function isValidBrandId(id: string | null | undefined): boolean {
  return !!id && BRANDS.some((b) => b.id === id);
}

export function isValidMarket(v: string | null | undefined): v is Market {
  return v === "bazaar" || v === "myket";
}

// پارس «KandooApp/<brand>.<market>/1.0» یا «KandooApp/<brand>/1.0» از User-Agent
// خروجی: { brandId, market } — market فقط برای خروجی های مارکتی
// چند توکن ممکن است همزمان باشند — اولویت با توکنی که مارکت دارد
export function parseBrandFromUA(userAgent: string | null | undefined): {
  brandId: string | null;
  market: Market | null;
} {
  if (!userAgent) return { brandId: null, market: null };
  const matches = userAgent.matchAll(/KandooApp\/([a-z0-9-]+)(?:\.([a-z]+))?\//gi);
  let fallbackBrand: string | null = null;
  for (const m of matches) {
    const brandId = m[1]?.toLowerCase() ?? null;
    const market = isValidMarket(m[2]) ? (m[2] as Market) : null;
    if (brandId && isValidBrandId(brandId)) {
      if (market) return { brandId, market };
      fallbackBrand ??= brandId;
    }
  }
  return { brandId: fallbackBrand, market: null };
}

// برند یک درخواست — UA اپ مارکتی → آن برند؛ بقیه → کندو
export function brandFromUA(userAgent: string | null | undefined): BrandConfig {
  const { brandId } = parseBrandFromUA(userAgent);
  return getBrandById(brandId);
}
