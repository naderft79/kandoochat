"use client";

// خلاصه و مشخصات کاربر در مودال: اطلاعات پروفایل، وضعیت ها، و همه شاخص های آماری
import { toPersianDigits, formatDateTimeCustom } from "@/lib/format";
import type { UserSummary } from "@/lib/admin-user-data";

const fa = (n: number) => toPersianDigits(Math.round(n).toLocaleString("en-US").replace(/,/g, "،"));
const coins = (n: number) => `${fa(n)} سکه`;
const toman = (n: number) => `${fa(n)} تومان`;
const count = (n: number) => fa(n);

type StatFormat = (n: number) => string;
type StatItem = { key: string; label: string; format?: StatFormat };
type StatGroup = { title: string; items: StatItem[] };

// همه ۳۸ شاخص خروجی getUserDetailStats (بدون جا افتادن)
export const STAT_GROUPS: StatGroup[] = [
  {
    title: "فعالیت و تعامل",
    items: [
      { key: "likesSent", label: "لایک داده" },
      { key: "superLikesSent", label: "سوپرلایک داده" },
      { key: "likesReceived", label: "لایک گرفته" },
      { key: "superLikesReceived", label: "سوپرلایک گرفته" },
      { key: "matches", label: "مچ" },
      { key: "conversations", label: "گفتگو" },
      { key: "profileViewsGiven", label: "بازدید پروفایل (داده)" },
      { key: "profileViewsReceived", label: "بازدید پروفایل (گرفته)" },
      { key: "logins", label: "تعداد ورود" },
    ],
  },
  {
    title: "پیام و رسانه",
    items: [
      { key: "messagesSent", label: "پیام ارسالی" },
      { key: "messagesReceived", label: "پیام دریافتی" },
      { key: "imagesSent", label: "عکس ارسالی در گفتگو" },
      { key: "voiceSent", label: "پیام صوتی ارسالی" },
      { key: "videoSent", label: "ویدیو ارسالی" },
    ],
  },
  {
    title: "استوری و هدیه",
    items: [
      { key: "storiesPosted", label: "استوری ارسالی" },
      { key: "storyViewsReceived", label: "بازدید استوری" },
      { key: "giftsSent", label: "هدیه ارسالی" },
      { key: "giftsReceived", label: "هدیه دریافتی" },
      { key: "giftCoinsSpent", label: "سکه خرج شده روی هدیه", format: coins },
    ],
  },
  {
    title: "مالی",
    items: [
      { key: "coinsPurchased", label: "سکه خریداری شده", format: coins },
      { key: "subscriptionCount", label: "تعداد خرید اشتراک" },
      { key: "boostsBought", label: "بوست خریداری شده" },
      { key: "featuredCount", label: "ورود به بخش ویژه" },
      { key: "coinsTransferredOut", label: "سکه انتقالی (ارسال)", format: coins },
      { key: "coinsTransferredIn", label: "سکه انتقالی (دریافت)", format: coins },
      { key: "transferFeesPaid", label: "کارمزد انتقال پرداختی", format: coins },
      { key: "coinsWithdrawn", label: "سکه برداشتی", format: coins },
      { key: "withdrawnToman", label: "مبلغ برداشتی", format: toman },
      { key: "withdrawalsPending", label: "برداشت در انتظار" },
    ],
  },
  {
    title: "دعوت، گزارش و نظارت",
    items: [
      { key: "referralsInvited", label: "دعوت شده" },
      { key: "referralsPaid", label: "دعوت فعال (پرداخت شده)" },
      { key: "reportsSent", label: "گزارش داده" },
      { key: "reportsReceived", label: "گزارش گرفته" },
      { key: "blocksGiven", label: "بلاک کرده" },
      { key: "blocksReceived", label: "بلاک شده" },
      { key: "ticketsOpened", label: "تیکت" },
      { key: "notifications", label: "اعلان" },
      { key: "adminActionsOnUser", label: "اقدام ادمین روی کاربر" },
    ],
  },
];

const GENDER_LABEL: Record<string, string> = { MALE: "پسر", FEMALE: "دختر" };
const ROLE_LABEL: Record<string, string> = {
  USER: "کاربر",
  ADMIN: "ادمین (سوپر)",
  SUPER_ADMIN: "سوپر ادمین",
  CONTENT_ADMIN: "ادمین محتوا",
  SUPPORT_ADMIN: "ادمین پشتیبانی",
};

export function Badge({ children, tone = "muted" }: { children: React.ReactNode; tone?: "gold" | "green" | "red" | "muted" }) {
  const cls = {
    gold: "bg-[rgba(212,175,55,0.12)] text-[#d4af37] border-[rgba(212,175,55,0.3)]",
    green: "bg-[rgba(52,211,153,0.1)] text-[#34d399] border-[rgba(52,211,153,0.3)]",
    red: "bg-[rgba(248,113,113,0.1)] text-[#f87171] border-[rgba(248,113,113,0.3)]",
    muted: "bg-[rgba(255,255,255,0.03)] text-[#888] border-[rgba(212,175,55,0.12)]",
  }[tone];
  return <span className={`inline-flex items-center px-2 py-0.5 rounded-full border text-[11px] font-bold ${cls}`}>{children}</span>;
}

function Field({ label, children }: { label: string; children: React.ReactNode }) {
  return (
    <div className="rounded-xl border border-[rgba(212,175,55,0.1)] px-3 py-2 min-w-0">
      <p className="text-[10px] text-[#888]">{label}</p>
      <p className="text-sm font-bold text-[#e8e8e8] break-words" dir="auto">{children}</p>
    </div>
  );
}

export default function SummaryPane({ s }: { s: UserSummary }) {
  return (
    <div className="space-y-5">
      <div className="flex flex-wrap gap-1.5">
        <Badge tone={s.isActive ? "green" : "red"}>{s.isActive ? "فعال" : "مسدود"}</Badge>
        <Badge tone={s.isOnline ? "green" : "muted"}>{s.isOnline ? "آنلاین" : "آفلاین"}</Badge>
        <Badge tone={s.phoneVerified ? "green" : "muted"}>{s.phoneVerified ? "موبایل تایید شده" : "موبایل تایید نشده"}</Badge>
        <Badge tone={s.isVerified ? "gold" : "muted"}>{s.isVerified ? "تیک آبی" : "بدون تیک آبی"}</Badge>
        <Badge tone={s.isIdentityVerified ? "gold" : "muted"}>{s.isIdentityVerified ? "احراز کامل" : "بدون احراز کامل"}</Badge>
        {s.isSpecial && <Badge tone="gold">کاربر ویژه</Badge>}
        {s.isFake && <Badge tone="red">حساب ربات (فیک)</Badge>}
        {s.isAICompanion && <Badge tone="gold">همراه هوش مصنوعی</Badge>}
        {s.role !== "USER" && <Badge tone="gold">{ROLE_LABEL[s.role] ?? s.role}</Badge>}
        {s.messageLocked && <Badge tone="red">قفل پیام</Badge>}
      </div>

      <section className="space-y-2">
        <h3 className="text-xs font-black text-[#d4af37]">مشخصات</h3>
        <div className="grid grid-cols-1 sm:grid-cols-2 xl:grid-cols-3 gap-2">
          <Field label="شماره موبایل">{s.phone}</Field>
          <Field label="یوزرنیم"><span dir="ltr">@{s.username}</span></Field>
          <Field label="جنسیت">{GENDER_LABEL[s.gender] ?? s.gender}</Field>
          <Field label="سن">{fa(s.age)} ساله</Field>
          <Field label="قد / وزن">{fa(s.height)} سانتی‌متر · {fa(s.weight)} کیلوگرم</Field>
          <Field label="درآمد ماهانه">{toman(s.income)}</Field>
          <Field label="استان / شهر">{s.province}، {s.city}</Field>
          <Field label="محله">{s.neighborhood ?? "—"}</Field>
          <Field label="شغل">{s.job ?? "—"}</Field>
          <Field label="خودرو">{s.carModel ?? "—"}</Field>
          <Field label="کد دعوت">{s.referralCode ? <span dir="ltr">{s.referralCode}</span> : "—"}</Field>
          <Field label="تاریخ عضویت">{formatDateTimeCustom(s.createdAt)}</Field>
          <Field label="آخرین بازدید">{formatDateTimeCustom(s.lastSeen)}</Field>
          <Field label="آخرین IP">{s.permissions.ip ? (s.lastIp ? <span dir="ltr">{s.lastIp}</span> : "ثبت نشده") : "دسترسی ندارید"}</Field>
          <Field label="موجودی کیف پول">{coins(s.balance)}</Field>
          <Field label="اشتراک فعال">
            {s.subscription
              ? `${formatDateTimeCustom(s.subscription.startsAt)} تا ${formatDateTimeCustom(s.subscription.endsAt)}`
              : "بدون اشتراک فعال"}
          </Field>
          <Field label="قفل پیام">
            {s.messageLocked
              ? `تا ${s.messageLockUntil ? formatDateTimeCustom(s.messageLockUntil) : ""}${s.messageLockReason ? ` · ${s.messageLockReason}` : ""}`
              : "ندارد"}
          </Field>
        </div>
        {s.bio && (
          <div className="rounded-xl border border-[rgba(212,175,55,0.1)] px-3 py-2">
            <p className="text-[10px] text-[#888]">بیو</p>
            <p className="text-sm text-[#e8e8e8] whitespace-pre-line break-words">{s.bio}</p>
          </div>
        )}
      </section>

      {STAT_GROUPS.map((group) => (
        <section key={group.title} className="space-y-2">
          <h3 className="text-xs font-black text-[#d4af37]">{group.title}</h3>
          <div className="grid grid-cols-2 md:grid-cols-3 xl:grid-cols-4 gap-2">
            {group.items.map((item) => {
              const value = s.stats[item.key] ?? 0;
              return (
                <div key={item.key} className="lux-card px-3 py-2 min-w-0">
                  <p className="text-[10px] text-[#888] truncate">{item.label}</p>
                  <p className="text-sm font-black text-[#e8e8e8] truncate">{item.format ? item.format(value) : count(value)}</p>
                </div>
              );
            })}
          </div>
        </section>
      ))}
    </div>
  );
}
