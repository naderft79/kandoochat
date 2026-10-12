// طبقه بندی منبع ورود بازدیدکننده: موتور جستجو، شبکه اجتماعی (از ارجاع دهنده یا مرورگر داخلی اپ)، تبلیغات، ارجاع، مستقیم
// تابع خالص است و بدون وابستگی به سرور؛ تست واحد دارد.

export type Channel = "SEARCH" | "SOCIAL" | "PAID" | "REFERRAL" | "DIRECT" | "INTERNAL";
export type Platform = "WEB" | "APP";

type SourceDef = {
  key: string;
  name: string;
  channel: "SEARCH" | "SOCIAL";
  hosts: RegExp[];
  uaTokens: string[];
};

// منابع شناخته شده؛ hosts با انتهای دامنه تطبیق داده می شود و uaTokens برای مرورگرهای داخلی اپ ها است
export const SOURCES: SourceDef[] = [
  { key: "google", name: "گوگل", channel: "SEARCH", hosts: [/(^|\.)google\.[a-z]{2,3}(\.[a-z]{2})?$/], uaTokens: [] },
  { key: "bing", name: "بینگ", channel: "SEARCH", hosts: [/(^|\.)bing\.com$/], uaTokens: [] },
  { key: "yahoo", name: "یاهو", channel: "SEARCH", hosts: [/(^|\.)yahoo\.[a-z.]{2,6}$/], uaTokens: [] },
  { key: "duckduckgo", name: "داک داک گو", channel: "SEARCH", hosts: [/(^|\.)duckduckgo\.com$/], uaTokens: [] },
  { key: "yandex", name: "یاندکس", channel: "SEARCH", hosts: [/(^|\.)yandex\.[a-z.]{2,6}$/], uaTokens: [] },
  { key: "baidu", name: "بایدو", channel: "SEARCH", hosts: [/(^|\.)baidu\.com$/], uaTokens: [] },
  { key: "ecosia", name: "اکوسیا", channel: "SEARCH", hosts: [/(^|\.)ecosia\.org$/], uaTokens: [] },
  { key: "brave", name: "براو", channel: "SEARCH", hosts: [/(^|\.)search\.brave\.com$/], uaTokens: [] },
  { key: "instagram", name: "اینستاگرام", channel: "SOCIAL", hosts: [/(^|\.)(instagram\.com|instagr\.am)$/], uaTokens: ["Instagram"] },
  { key: "telegram", name: "تلگرام", channel: "SOCIAL", hosts: [/(^|\.)(t\.me|telegram\.org|telegram\.me)$/], uaTokens: ["Telegram"] },
  { key: "x", name: "ایکس (توییتر)", channel: "SOCIAL", hosts: [/(^|\.)(twitter\.com|x\.com|t\.co)$/], uaTokens: ["Twitter"] },
  { key: "facebook", name: "فیسبوک", channel: "SOCIAL", hosts: [/(^|\.)(facebook\.com|fb\.com|fb\.me)$/], uaTokens: ["FBAN", "FBAV", "FB_IAB"] },
  { key: "linkedin", name: "لینکدین", channel: "SOCIAL", hosts: [/(^|\.)linkedin\.com$/], uaTokens: ["LinkedInApp"] },
  { key: "youtube", name: "یوتیوب", channel: "SOCIAL", hosts: [/(^|\.)(youtube\.com|youtu\.be)$/], uaTokens: [] },
  { key: "tiktok", name: "تیک تاک", channel: "SOCIAL", hosts: [/(^|\.)tiktok\.com$/], uaTokens: ["musical_ly", "BytedanceWebview"] },
  { key: "whatsapp", name: "واتساپ", channel: "SOCIAL", hosts: [/(^|\.)(whatsapp\.com|wa\.me)$/], uaTokens: ["WhatsApp"] },
  { key: "pinterest", name: "پینترست", channel: "SOCIAL", hosts: [/(^|\.)pinterest\.[a-z.]{2,6}$/], uaTokens: [] },
  { key: "reddit", name: "ردیت", channel: "SOCIAL", hosts: [/(^|\.)reddit\.com$/], uaTokens: [] },
  { key: "threads", name: "Threads", channel: "SOCIAL", hosts: [/(^|\.)threads\.net$/], uaTokens: [] },
  { key: "aparat", name: "آپارات", channel: "SOCIAL", hosts: [/(^|\.)aparat\.com$/], uaTokens: [] },
  { key: "eitaa", name: "ایتا", channel: "SOCIAL", hosts: [/(^|\.)eitaa\.(com|ir)$/], uaTokens: [] },
  { key: "bale", name: "بله", channel: "SOCIAL", hosts: [/(^|\.)bale\.ai$/], uaTokens: [] },
];

const SOURCE_BY_KEY = new Map(SOURCES.map((s) => [s.key, s]));
const PAID_MEDIUMS = new Set(["cpc", "ppc", "paid", "paidsocial", "paid_social", "display"]);
const SOCIAL_MEDIUMS = new Set(["social", "social-network", "social_network"]);

// نام فارسی یک کلید منبع (برای منابع ناشناخته همان متن کلید یا دامنه)
export function sourceNameFa(key: string): string {
  if (key === "direct") return "مستقیم";
  if (key === "internal") return "داخلی سایت";
  return SOURCE_BY_KEY.get(key)?.name ?? key;
}

// کلید امن برای utm یا دامنه: حروف کوچک لاتین، عدد، نقطه، خط تیره و زیرخط؛ حداکثر ۴۰ کاراکتر
function safeKey(raw: string): string | null {
  const k = raw.trim().toLowerCase().slice(0, 40);
  return /^[a-z0-9._-]+$/.test(k) ? k : null;
}

function hostOf(referrer: string): string | null {
  try {
    return new URL(referrer).hostname.toLowerCase();
  } catch {
    return null;
  }
}

export function detectPlatform(ua: string): Platform {
  // کپسول اندروید با توکن KandooApp در User-Agent شناخته می شود؛ وب ویوی بدون توکن هم با نشانه wv
  if (/KandooApp/i.test(ua)) return "APP";
  if (/Android/i.test(ua) && /;\s?wv\)/.test(ua)) return "APP";
  return "WEB";
}

export type ClassifyInput = {
  referrer: string | null;
  ownHost: string;
  ua: string;
  utmSource: string | null;
  utmMedium: string | null;
};

// منبع ورود یک بازدید اول نشست؛ ترتیب: utm، مرورگر داخلی اپ، ارجاع دهنده، مستقیم
export function classifyEntry(input: ClassifyInput): { channel: Channel; source: string; platform: Platform } {
  const platform = detectPlatform(input.ua);

  if (input.utmSource) {
    const key = safeKey(input.utmSource);
    if (key) {
      const known = SOURCE_BY_KEY.get(key);
      if (known) return { channel: known.channel, source: known.key, platform };
      const medium = (input.utmMedium ?? "").toLowerCase();
      if (PAID_MEDIUMS.has(medium)) return { channel: "PAID", source: key, platform };
      if (SOCIAL_MEDIUMS.has(medium)) return { channel: "SOCIAL", source: key, platform };
      return { channel: "REFERRAL", source: key, platform };
    }
  }

  // مرورگر داخلی اینستاگرام و تلگرام ارجاع نمی فرستند؛ از روی User-Agent شناخته می شوند
  for (const s of SOURCES) {
    if (s.uaTokens.some((t) => input.ua.includes(t))) return { channel: s.channel, source: s.key, platform };
  }

  const host = input.referrer ? hostOf(input.referrer) : null;
  if (host && host !== input.ownHost.toLowerCase()) {
    for (const s of SOURCES) {
      if (s.hosts.some((re) => re.test(host))) return { channel: s.channel, source: s.key, platform };
    }
    return { channel: "REFERRAL", source: host.slice(0, 80), platform };
  }

  return { channel: "DIRECT", source: "direct", platform };
}
