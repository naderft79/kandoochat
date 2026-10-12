// برچسب ها و زیرفیلترهای تب های مودال پروفایل کاربر (فقط نمایش؛ مجوز در سرور و lib/permissions بررسی می شود)
import type { UserTab } from "@/lib/permissions";

export type KindOption = { key: string; label: string };

export const TAB_LABELS: Record<UserTab, string> = {
  summary: "خلاصه و مشخصات",
  finance: "مالی",
  media: "رسانه و محتوا",
  messages: "پیام ها",
  activity: "فعالیت و امنیت",
  verification: "احراز هویت",
  bot: "ربات و فیک",
};

export const TAB_KINDS: Partial<Record<UserTab, KindOption[]>> = {
  finance: [
    { key: "", label: "تراکنش ها" },
    { key: "coins", label: "انتقال سکه" },
    { key: "withdrawals", label: "برداشت ها" },
    { key: "subscriptions", label: "اشتراک ها" },
    { key: "gifts", label: "هدیه ها" },
    { key: "boosts", label: "بوست ها" },
    { key: "featured", label: "بخش ویژه" },
    { key: "payments", label: "پرداخت ها" },
  ],
  media: [
    { key: "", label: "عکس ها" },
    { key: "stories", label: "استوری ها" },
    { key: "chatMedia", label: "رسانه گفتگو" },
  ],
  activity: [
    { key: "", label: "ورود و فعالیت" },
    { key: "reports", label: "گزارش ها" },
    { key: "blocks", label: "بلاک ها" },
    { key: "tickets", label: "تیکت ها" },
    { key: "notifications", label: "اعلان ها" },
    { key: "views", label: "بازدید پروفایل" },
    { key: "likes", label: "لایک ها" },
    { key: "referrals", label: "دعوت ها" },
    { key: "adminActions", label: "اقدامات ادمین" },
  ],
};

// تب هایی که جستجوی متنی سمت سرور دارند (finance پیش فرض، activity پیش فرض، bot)
export function isSearchable(tab: UserTab, kind: string): boolean {
  if (tab === "bot") return true;
  if (tab === "finance") return kind === "";
  if (tab === "activity") return kind === "";
  return false;
}

export const RANGE_OPTIONS: KindOption[] = [
  { key: "all", label: "همه" },
  { key: "7", label: "۷ روز" },
  { key: "30", label: "۳۰ روز" },
];
