// توابع کمکی فرمت اعداد و تاریخ فارسی
export function toPersianDigits(input: string | number): string {
  const persian = ["۰", "۱", "۲", "۳", "۴", "۵", "۶", "۷", "۸", "۹"];
  return String(input).replace(/\d/g, (d) => persian[parseInt(d, 10)]);
}

// فرمت تومان با جداکننده هزارگان
export function formatToman(amount: number): string {
  return toPersianDigits(amount.toLocaleString("en-US").replace(/,/g, "،")) + " تومان";
}

// فرمت تعداد سکه
export function formatCoins(coins: number): string {
  return toPersianDigits(coins.toLocaleString("en-US").replace(/,/g, "،")) + " سکه";
}

// تاریخ شمسی
export function formatDate(date: Date | string): string {
  return new Intl.DateTimeFormat("fa-IR", {
    year: "numeric",
    month: "long",
    day: "numeric",
  }).format(new Date(date));
}

// تاریخ و ساعت شمسی
export function formatDateTime(date: Date | string): string {
  return new Intl.DateTimeFormat("fa-IR", {
    year: "numeric",
    month: "short",
    day: "numeric",
    hour: "2-digit",
    minute: "2-digit",
  }).format(new Date(date));
}

// تاریخ و ساعت شمسی با فرمت دقیق — مثال: ۸ شهریور ۱۴۰۵ - ۰۰:۴۷
export function formatDateTimeCustom(date: Date | string): string {
  const d = new Date(date);
  const formatter = new Intl.DateTimeFormat("fa-IR-u-ca-persian", {
    day: "numeric",
    month: "long",
    year: "numeric",
  });
  const parts = formatter.formatToParts(d);
  const day = parts.find((p) => p.type === "day")?.value ?? "";
  const month = parts.find((p) => p.type === "month")?.value ?? "";
  const year = parts.find((p) => p.type === "year")?.value ?? "";

  const timeFormatter = new Intl.DateTimeFormat("fa-IR", {
    hour: "2-digit",
    minute: "2-digit",
    hour12: false,
  });
  const time = timeFormatter.format(d);

  return `${day} ${month} ${year} - ${time}`;
}

// ساعت
export function formatTime(date: Date | string): string {
  return new Intl.DateTimeFormat("fa-IR", {
    hour: "2-digit",
    minute: "2-digit",
  }).format(new Date(date));
}

// فاصله بین دو نقطه جغرافیایی (کیلومتر) — فرمول Haversine
export function calculateDistance(
  lat1: number,
  lon1: number,
  lat2: number,
  lon2: number
): number {
  const R = 6371;
  const dLat = ((lat2 - lat1) * Math.PI) / 180;
  const dLon = ((lon2 - lon1) * Math.PI) / 180;
  const a =
    Math.sin(dLat / 2) * Math.sin(dLat / 2) +
    Math.cos((lat1 * Math.PI) / 180) *
      Math.cos((lat2 * Math.PI) / 180) *
      Math.sin(dLon / 2) *
      Math.sin(dLon / 2);
  const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
  return Math.round(R * c);
}

// فرمت فاصله — مثلا "۳ کیلومتر"
export function formatDistance(km: number): string {
  if (km < 1) return "کمتر از ۱ کیلومتر";
  return `${toPersianDigits(km)} کیلومتر`;
}

// فرمت آخرین بازدید — مثلا "۲ ساعت پیش" یا تاریخ کامل
export function formatLastSeen(lastSeen: Date): string {
  const diff = Date.now() - new Date(lastSeen).getTime();
  const seconds = Math.floor(diff / 1000);
  const minutes = Math.floor(seconds / 60);
  const hours = Math.floor(minutes / 60);
  const days = Math.floor(hours / 24);

  if (seconds < 60) return "همین الان";
  if (minutes < 60) return `${toPersianDigits(minutes)} دقیقه پیش`;
  if (hours < 24) return `${toPersianDigits(hours)} ساعت پیش`;
  if (days < 7) return `${toPersianDigits(days)} روز پیش`;
  return formatDateTimeCustom(lastSeen);
}

// تبدیل ارقام فارسی و عربی به انگلیسی (برای ورودی شماره موبایل و کد)
export function normalizeDigits(input: string): string {
  return input
    .replace(/[۰-۹]/g, (d) => String(d.charCodeAt(0) - 0x06f0))
    .replace(/[٠-٩]/g, (d) => String(d.charCodeAt(0) - 0x0660));
}
