// نام فارسی صفحات سایت برای آمار بازدید (هر مسیر یک کلید و نام عمومی دارد؛ شناسه کاربر هرگز نمایش داده نمی شود)
// ترتیب مهم است: الگوهای خاص تر قبل از الگوهای کلی تر آمده اند.

export type PageDef = { key: string; name: string; path: string; pattern: RegExp };

const DEFS: Omit<PageDef, "pattern">[] = [
  { key: "home", name: "صفحه اصلی", path: "/" },
  { key: "about", name: "درباره ما", path: "/about" },
  { key: "contact", name: "تماس با ما", path: "/contact" },
  { key: "help", name: "راهنما", path: "/help" },
  { key: "privacy", name: "حریم خصوصی", path: "/privacy" },
  { key: "terms", name: "قوانین و مقررات", path: "/terms" },
  { key: "login", name: "صفحه ورود", path: "/login" },
  { key: "register", name: "صفحه ثبت نام", path: "/register" },
  { key: "register_special", name: "ثبت نام ویژه", path: "/register/special" },
  { key: "register_slug", name: "ثبت نام با لینک اختصاصی", path: "/register/[slug]" },
  { key: "forgot_password", name: "بازیابی رمز عبور", path: "/forgot-password" },
  { key: "onboarding", name: "معرفی برنامه (شروع)", path: "/onboarding" },
  { key: "invite", name: "صفحه دعوت دوستان", path: "/invite/[code]" },
  { key: "maintenance", name: "صفحه تعمیرات", path: "/maintenance" },
  { key: "offline", name: "صفحه آفلاین", path: "/offline" },
  { key: "dashboard", name: "داشبورد کاربر", path: "/dashboard" },
  { key: "blocked", name: "لیست مسدودها", path: "/dashboard/blocked" },
  { key: "chat_list", name: "لیست گفتگوها", path: "/dashboard/chat" },
  { key: "chat", name: "صفحه گفتگو", path: "/dashboard/chat/[id]" },
  { key: "coins", name: "صفحه سکه ها", path: "/dashboard/coins" },
  { key: "notifications", name: "صفحه اعلان ها", path: "/dashboard/notifications" },
  { key: "likes", name: "صفحه لایک ها", path: "/dashboard/likes" },
  { key: "activity", name: "صفحه فعالیت من", path: "/dashboard/activity" },
  { key: "missions", name: "صفحه ماموریت ها", path: "/dashboard/missions" },
  { key: "my_profile", name: "صفحه پروفایل من", path: "/dashboard/profile" },
  { key: "referral", name: "صفحه دعوت دوستان", path: "/dashboard/referral" },
  { key: "search", name: "صفحه جستجو", path: "/dashboard/search" },
  { key: "settings", name: "صفحه تنظیمات", path: "/dashboard/settings" },
  { key: "subscription", name: "صفحه خرید اشتراک", path: "/dashboard/subscription" },
  { key: "support", name: "صفحه پشتیبانی", path: "/dashboard/support" },
  { key: "support_chat", name: "گفتگوی پشتیبانی", path: "/dashboard/support/[id]" },
  { key: "verify", name: "صفحه احراز هویت", path: "/dashboard/verify" },
  { key: "profile", name: "صفحه پروفایل", path: "/profile/[username]" },
];

function toPattern(path: string): RegExp {
  const escaped = path
    .split("/")
    .map((seg) => (seg.startsWith("[") ? "[^/]+" : seg.replace(/[.*+?^${}()|[\]\\]/g, "\\$&")))
    .join("/");
  return new RegExp(`^${escaped}$`);
}

export const PAGES: PageDef[] = DEFS.map((d) => ({ ...d, pattern: toPattern(d.path) }));

const BY_KEY = new Map(PAGES.map((p) => [p.key, p]));

// تشخیص صفحه از مسیر؛ مسیرهای ناشناخته (مثل /ui-kit یا /_next) null برمی گردند تا شمارش نشوند
export function resolvePage(pathname: string): { key: string; name: string; path: string } | null {
  const clean = pathname.split("?")[0].split("#")[0];
  const normalized = clean.length > 1 ? clean.replace(/\/+$/, "") : clean;
  const hit = PAGES.find((p) => p.pattern.test(normalized));
  return hit ? { key: hit.key, name: hit.name, path: hit.path } : null;
}

// نام فارسی یک کلید صفحه ذخیره شده
export function pageNameOf(key: string): string {
  return BY_KEY.get(key)?.name ?? "صفحه دیگر";
}
