// توابع کشور بدون وابستگی به سرور (قابل استفاده در کلاینت): اعتبارسنجی کد، نام فارسی و مسیر پرچم
export const COUNTRY_CODE_PATTERN = /^[A-Z]{2}$/;

export function normalizeCountryCode(code: string | null | undefined): string | null {
  if (!code) return null;
  const up = code.toUpperCase();
  return COUNTRY_CODE_PATTERN.test(up) ? up : null;
}

// نام فارسی کشور (مثلاً IR به ایران)
export function countryNameFa(code: string | null | undefined): string {
  const c = normalizeCountryCode(code);
  if (!c) return "نامشخص";
  try {
    return new Intl.DisplayNames(["fa"], { type: "region" }).of(c) ?? c;
  } catch {
    return c;
  }
}

// مسیر SVG پرچم از پوشه public (flag-icons، نسبت ۴:۳)؛ کد نامعتبر مسیر نمی گیرد
export function flagSrc(code: string | null | undefined): string | null {
  const c = normalizeCountryCode(code);
  return c ? `/flags/4x3/${c.toLowerCase()}.svg` : null;
}
