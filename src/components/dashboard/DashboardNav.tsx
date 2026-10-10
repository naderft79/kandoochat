"use client";

// ناوبری اینستاگرامی: ۵ دکمه اصلی (خانه، جستجو، پیام ها، سکه، پروفایل)
// سایدبار دسکتاپ شبیه اینستاگرام + نوار پایین موبایل
import { useState } from "react";
import Image from "next/image";
import Link from "next/link";
import { usePathname, useRouter } from "next/navigation";
import { useLiveData } from "@/components/dashboard/LiveDataProvider";
import {
  Search,
  MessageCircle,
  User,
  Menu,
  Crown,
  LogOut,
  X,
  Settings,
  Gift,
  Wallet,
  Headphones,
  Bell,
  Hexagon,
} from "lucide-react";
import CoinBadge from "@/components/dashboard/CoinBadge";
import { usePresence } from "@/hooks/usePresence";
import { toPersianDigits } from "@/lib/format";
import KandooLogo from "@/components/KandooLogo";
import DefaultAvatar from "@/components/dashboard/DefaultAvatar";

// ۵ دکمه اصلی اینستاگرام
const mainItems = [
  { href: "/dashboard", label: "خانه", icon: Hexagon, iconActive: null },
  { href: "/dashboard/search", label: "جستجو", icon: Search, iconActive: null },
  { href: "/dashboard/chat", label: "پیام ها", icon: MessageCircle, iconActive: null },
  { href: "/dashboard/coins", label: "کیف پول", icon: Wallet, iconActive: null },
  { href: "/dashboard/profile", label: "پروفایل", icon: User, iconActive: null },
];

// آیتم های منوی بیشتر (مثل اینستاگرام)
const moreItems = [
  { href: "/dashboard/notifications", label: "اعلان ها", icon: Bell },
  { href: "/dashboard/subscription", label: "اشتراک", icon: Crown },
  { href: "/dashboard/referral", label: "دعوت دوستان", icon: Gift },
  { href: "/dashboard/support", label: "پشتیبانی", icon: Headphones },
  { href: "/dashboard/settings", label: "تنظیمات", icon: Settings },
];

// آیکن تب: حالت فعال Filled (مثل اینستاگرام)
function NavIcon({ item, active, className }: { item: (typeof mainItems)[number]; active: boolean; className: string }) {
  const Icon = item.icon as React.ComponentType<{ className?: string; strokeWidth?: number; fill?: string }>;
  const filled = active && item.href !== "/dashboard/search";
  return <Icon className={className} strokeWidth={active ? 2.5 : 2} fill={filled ? "currentColor" : "none"} />;
}

export default function DashboardNav({
  userPhoto,
}: {
  fullName?: string;
  userPhoto?: string | null;
}) {
  const pathname = usePathname();
  const router = useRouter();
  const [moreOpen, setMoreOpen] = useState(false);
  // تعداد گفتگوهای نخوانده از Provider زنده می آید (بدون polling)
  const { unreadConversations: unreadCount } = useLiveData();

  usePresence();

  // فرمت نمایش عدد: تا ۱۰ واقعی، بالای ۱۰ -> +10، بالای ۲۰ -> +20، نهایتا +99
  function formatBadge(count: number): string {
    if (count <= 10) return toPersianDigits(count);
    if (count <= 20) return "+۱۰";
    if (count <= 30) return "+۲۰";
    if (count <= 40) return "+۳۰";
    if (count <= 50) return "+۴۰";
    if (count <= 60) return "+۵۰";
    if (count <= 70) return "+۶۰";
    if (count <= 80) return "+۷۰";
    if (count <= 90) return "+۸۰";
    return "+۹۹";
  }

  async function logout() {
    await fetch("/api/auth/logout", { method: "POST" });
    router.push("/");
    router.refresh();
  }

  // ضربه روی تب فعال: برگشت به بالای صفحه
  function scrollTop() {
    document.querySelector("main")?.scrollTo({ top: 0, behavior: "smooth" });
  }

  function isActive(href: string) {
    return href === "/dashboard"
      ? pathname === "/dashboard"
      : pathname.startsWith(href);
  }

  return (
    <>
      {/* سایدبار دسکتاپ — دقیقا مثل اینستاگرام */}
      <aside className="hidden lg:flex flex-col w-16 lg:w-56 xl:w-64 shrink-0 bg-white border-l border-ig-border min-h-screen sticky top-0 h-screen transition-all duration-300">
        {/* لوگو + سکه */}
        <div className="px-3 lg:px-6 pt-8 pb-4">
          <KandooLogo href="/dashboard" iconClassName="w-8 h-8 xl:w-9 xl:h-9" textClassName="text-xl xl:text-2xl lg:block hidden" />
          <div className="lg:hidden flex justify-center">
            <KandooLogo href="/dashboard" iconClassName="w-8 h-8" textClassName="hidden" />
          </div>
          <div className="mt-3 lg:block hidden">
            <CoinBadge />
          </div>
        </div>

        {/* منوی اصلی */}
        <nav className="flex-1 px-3 space-y-1">
          {mainItems.map((item) => {
            const active = isActive(item.href);
            return (
              <Link
                key={item.href}
                href={item.href}
                aria-label={item.label}
                aria-current={active ? "page" : undefined}
                onClick={() => active && scrollTop()}
                className="flex items-center gap-4 px-3 py-3 rounded-lg hover:bg-ig-gray-bg transition-colors group lg:justify-start justify-center"
              >
                {item.href === "/dashboard/profile" ? (
                  // پروفایل: عکس کاربر یا آواتار پیش فرض
                  userPhoto ? (
                    <Image src={userPhoto} alt="پروفایل" width={24} height={24} className={`w-6 h-6 rounded-full object-cover shrink-0 ${active ? "ring-2 ring-foreground" : ""}`} />
                  ) : (
                    <DefaultAvatar size={24} />
                  )
                ) : (
                  <NavIcon item={item} active={active} className={`w-6 h-6 shrink-0 transition-all ${
                      active ? "text-foreground" : "text-foreground group-hover:opacity-70"
                    }`} />
                )}
                <span
                  className={`text-sm transition-all lg:block hidden ${
                    active ? "font-bold text-foreground" : "font-normal text-foreground"
                  }`}
                >
                  {item.label}
                </span>
                {item.href === "/dashboard/chat" && unreadCount > 0 && (
                  <span className="min-w-[20px] h-5 bg-ig-red rounded-full flex items-center justify-center text-xs font-bold text-white px-1.5 lg:relative absolute top-1 right-1">
                    {formatBadge(unreadCount)}
                  </span>
                )}
              </Link>
            );
          })}

          {/* منوی بیشتر — مثل اینستاگرام */}
          <button
            onClick={() => setMoreOpen(true)}
            className="w-full flex items-center gap-4 px-3 py-3 rounded-lg hover:bg-ig-gray-bg transition-colors group lg:justify-start justify-center"
          >
            <Menu className="w-6 h-6 shrink-0 text-foreground group-hover:opacity-70" strokeWidth={1.8} />
            <span className="text-sm font-normal text-foreground lg:block hidden">بیشتر</span>
          </button>
        </nav>
      </aside>

      {/* پنل کشویی "بیشتر" دسکتاپ — مثل اینستاگرام */}
      {moreOpen && (
        <div
          className="hidden lg:block fixed inset-0 z-50 bg-black/30"
          onClick={() => setMoreOpen(false)}
        >
          <div
            className="absolute right-0 top-0 h-full w-56 xl:w-64 bg-white border-l border-ig-border ig-modal-in"
            onClick={(e) => e.stopPropagation()}
          >
            <div className="flex items-center justify-between px-6 pt-8 pb-6">
              <KandooLogo iconClassName="w-7 h-7" textClassName="text-xl" />
              <button onClick={() => setMoreOpen(false)} className="p-1 hover:bg-ig-gray-bg rounded-lg">
                <X className="w-5 h-5" />
              </button>
            </div>
            <nav className="px-3 space-y-1">
              {moreItems.map((item) => (
                <Link
                  key={item.label}
                  href={item.href}
                  onClick={() => setMoreOpen(false)}
                  className="flex items-center gap-4 px-3 py-3 rounded-lg hover:bg-ig-gray-bg transition-colors"
                >
                  <item.icon className="w-6 h-6 shrink-0" strokeWidth={1.8} />
                  <span className="text-sm">{item.label}</span>
                </Link>
              ))}
              <button
                onClick={logout}
                className="w-full flex items-center gap-4 px-3 py-3 rounded-lg hover:bg-ig-gray-bg transition-colors"
              >
                <LogOut className="w-6 h-6 shrink-0" strokeWidth={1.8} />
                <span className="text-sm text-ig-red">خروج</span>
              </button>
            </nav>
          </div>
        </div>
      )}

      {/* نوار پایین موبایل — ۵ آیکن مثل اینستاگرام */}
      <nav className="lg:hidden fixed bottom-0 inset-x-0 z-40 bg-white border-t border-ig-border flex items-center justify-around px-2 py-1 pb-[env(safe-area-inset-bottom)]">
        {mainItems.map((item) => {
          const active = isActive(item.href);
          return (
            <Link
              key={item.href}
              href={item.href}
              aria-label={item.label}
              aria-current={active ? "page" : undefined}
              onClick={() => active && scrollTop()}
              className="flex items-center justify-center flex-1 h-12 transition-transform active:scale-90"
            >
              {item.href === "/dashboard/profile" ? (
                userPhoto ? (
                  <Image src={userPhoto} alt="پروفایل" width={24} height={24} className={`w-6 h-6 rounded-full object-cover ${active ? "ring-2 ring-foreground" : ""}`} />
                ) : (
                  <DefaultAvatar size={24} />
                )
              ) : (
                <div className="relative">
                  <NavIcon item={item} active={active} className={`w-6 h-6 ${active ? "text-foreground" : "text-foreground"}`} />
                  {item.href === "/dashboard/chat" && unreadCount > 0 && (
                    <span className="absolute -top-1 -right-1 min-w-[16px] h-4 bg-ig-red rounded-full flex items-center justify-center text-xs font-bold text-white px-1">
                      {formatBadge(unreadCount)}
                    </span>
                  )}
                </div>
              )}
            </Link>
          );
        })}
      </nav>
    </>
  );
}
