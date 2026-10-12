// ماتریس دسترسی بخش های مودال پروفایل کاربر در پنل ادمین
// این فایل عمداً بدون import سرور است تا در کامپوننت های کلاینت هم استفاده شود.
// نقش ADMIN قدیمی طبق تصمیم محصول مترادف SUPER_ADMIN است.

export const USER_TABS = ["summary", "finance", "media", "messages", "activity", "verification", "bot"] as const;
export type UserTab = (typeof USER_TABS)[number];

const FULL_ROLES = ["SUPER_ADMIN", "ADMIN"];
const ALL_ADMIN_ROLES = ["SUPER_ADMIN", "ADMIN", "CONTENT_ADMIN", "SUPPORT_ADMIN"];

const TAB_ROLES: Record<UserTab, string[]> = {
  summary: ALL_ADMIN_ROLES,
  finance: FULL_ROLES,
  media: [...FULL_ROLES, "CONTENT_ADMIN"],
  messages: FULL_ROLES,
  activity: [...FULL_ROLES, "SUPPORT_ADMIN"],
  verification: FULL_ROLES,
  bot: FULL_ROLES,
};

export function canAccessUserTab(role: string | null | undefined, tab: UserTab): boolean {
  return !!role && TAB_ROLES[tab].includes(role);
}

// شماره کامل و آی پی فقط برای مدیران کامل
export function canViewFullPhone(role: string | null | undefined): boolean {
  return !!role && FULL_ROLES.includes(role);
}

export function canViewIp(role: string | null | undefined): boolean {
  return canViewFullPhone(role);
}

// متن پیام های خصوصی فقط برای مدیران کامل (با ثبت در لاگ)
export function canViewPrivateMessages(role: string | null | undefined): boolean {
  return canViewFullPhone(role);
}
