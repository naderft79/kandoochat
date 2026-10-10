// ابزار تاریخ شمسی (جلالی) — تبدیل به میلادی و کمک های نمایش
import * as jalaali from "jalaali-js";

export const JALALI_MONTHS = [
  "فروردین",
  "اردیبهشت",
  "خرداد",
  "تیر",
  "مرداد",
  "شهریور",
  "مهر",
  "آبان",
  "آذر",
  "دی",
  "بهمن",
  "اسفند",
];

// تبدیل تاریخ شمسی به رشته ISO میلادی YYYY-MM-DD برای ذخیره در دیتابیس
export function jalaliToISODate(jy: number, jm: number, jd: number): string {
  const g = jalaali.toGregorian(jy, jm, jd);
  return `${g.gy}-${String(g.gm).padStart(2, "0")}-${String(g.gd).padStart(2, "0")}`;
}

// تعداد روزهای ماه شمسی (با توجه به کبیسه بودن سال برای اسفند)
export function jalaliMonthDays(jy: number, jm: number): number {
  return jalaali.jalaaliMonthLength(jy, jm);
}

// سال شمسی جاری
export function currentJalaliYear(): number {
  return jalaali.toJalaali(new Date()).jy;
}

const FA_DIGITS = "۰۱۲۳۴۵۶۷۸۹";

// تبدیل رشته ISO میلادی (YYYY-MM-DD) به نمایش شمسی با اعداد فارسی، مثل «۱۵ مرداد ۱۳۶۴»
export function isoToJalaliDisplay(iso: string): string {
  const m = /^(\d{4})-(\d{2})-(\d{2})$/.exec(iso.trim());
  if (!m) return iso;
  const j = jalaali.toJalaali(Number(m[1]), Number(m[2]), Number(m[3]));
  const fa = (n: number) => String(n).replace(/\d/g, (d) => FA_DIGITS[Number(d)]);
  return `${fa(j.jd)} ${JALALI_MONTHS[j.jm - 1]} ${fa(j.jy)}`;
}
