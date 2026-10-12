"use client";

// ناوبری پنل مدیریت: قابل جمع شدن با همبرگری
import { useState, useEffect } from "react";
import Link from "next/link";
import { usePathname, useRouter } from "next/navigation";
import {
  LayoutDashboard,
  Users,
  Settings,
  LogOut,
  Flag,
  Megaphone,
  Rocket,
  BarChart3,
  Activity,
  Wallet,
  BadgeCheck,
  ScrollText,
  CircleDot,
  Target,
  Heart,
  Ticket as TicketIcon,
  ShieldCheck,
  Banknote,
  ArrowLeftRight,
  TrendingUp,
  Database,
  Bot,
  Sparkles,
  X,
} from "lucide-react";

type NavItem = { href: string; label: string; icon: typeof LayoutDashboard };
type NavGroup = { title: string; items: NavItem[] };

const groups: NavGroup[] = [
  {
    title: "اصلی",
    items: [
      { href: "/admin", label: "داشبورد", icon: LayoutDashboard },
      { href: "/admin/users", label: "کاربران", icon: Users },
      { href: "/admin/photos", label: "تایید عکس", icon: BadgeCheck },
      { href: "/admin/stories", label: "تایید استوری", icon: CircleDot },
      { href: "/admin/verify", label: "احراز هویت", icon: ShieldCheck },
    ],
  },
  {
    title: "ارتباطات",
    items: [
      { href: "/admin/tickets", label: "تیکت ها", icon: TicketIcon },
      { href: "/admin/reports", label: "گزارش ها", icon: Flag },
      { href: "/admin/broadcasts", label: "پیام گروهی", icon: Megaphone },
      { href: "/admin/bot", label: "ربات تشویقی", icon: Bot },
    ],
  },
  {
    title: "مالی و اشتراک",
    items: [
      { href: "/admin/finance", label: "مالی", icon: Wallet },
      { href: "/admin/withdrawals", label: "برداشت ها", icon: Banknote },
      { href: "/admin/transactions", label: "تراکنش ها", icon: ArrowLeftRight },
      { href: "/admin/boosts", label: "بوست ها", icon: Rocket },
      { href: "/admin/featured", label: "بخش ویژه", icon: Sparkles },
      { href: "/admin/missions", label: "ماموریت ها", icon: Target },
    ],
  },
  {
    title: "آمار و امنیت",
    items: [
      { href: "/admin/analytics", label: "آنالیز لحظه ای", icon: Activity },
      { href: "/admin/stats", label: "آمار", icon: BarChart3 },
      { href: "/admin/retention", label: "Retention", icon: TrendingUp },
      { href: "/admin/interests", label: "علایق", icon: Heart },
      { href: "/admin/audit", label: "لاگ اقدامات", icon: ScrollText },
      { href: "/admin/backup", label: "بکاپ", icon: Database },
      { href: "/admin/settings", label: "تنظیمات", icon: Settings },
    ],
  },
];

const allItems = groups.flatMap((g) => g.items);

// آیکون هر گروه برای حالت بسته
const groupIcons: Record<string, typeof LayoutDashboard> = {
  "اصلی": LayoutDashboard,
  "ارتباطات": Megaphone,
  "مالی و اشتراک": Wallet,
  "آمار و امنیت": Activity,
};

export default function AdminNav() {
  const pathname = usePathname();
  const router = useRouter();
  const [collapsed, setCollapsed] = useState(false);
  const [hoveredGroup, setHoveredGroup] = useState<string | null>(null);
  const [mobileOpen, setMobileOpen] = useState(false);

  // بارگذاری حالت از localStorage
  useEffect(() => {
    const saved = localStorage.getItem("admin-nav-collapsed");
    if (saved === "true") setCollapsed(true);
  }, []);

  // ذخیره حالت در localStorage
  useEffect(() => {
    localStorage.setItem("admin-nav-collapsed", String(collapsed));
  }, [collapsed]);

  // بستن منوی موبایل هنگام تغییر مسیر
  useEffect(() => {
    setMobileOpen(false);
  }, [pathname]);

  async function logout() {
    await fetch("/api/auth/logout", { method: "POST" });
    router.push("/");
    router.refresh();
  }

  function isActive(href: string) {
    return href === "/admin" ? pathname === "/admin" : pathname.startsWith(href);
  }

  return (
    <>
      {/* دکمه همبرگری موبایل/تبلت */}
      <button
        onClick={() => setMobileOpen(!mobileOpen)}
        className="lg:hidden fixed top-3 right-3 z-50 w-10 h-10 rounded-xl lux-sidebar border border-[rgba(212,175,55,0.2)] flex items-center justify-center transition-all active:scale-90"
        aria-label="منو"
      >
        <div className="relative w-5 h-5 flex flex-col justify-center items-center">
          <span className={`absolute h-0.5 w-5 bg-[#d4af37] rounded-full transition-all duration-300 ${mobileOpen ? "rotate-45" : "-translate-y-1.5"}`} />
          <span className={`absolute h-0.5 w-5 bg-[#d4af37] rounded-full transition-all duration-300 ${mobileOpen ? "opacity-0" : "opacity-100"}`} />
          <span className={`absolute h-0.5 w-5 bg-[#d4af37] rounded-full transition-all duration-300 ${mobileOpen ? "-rotate-45" : "translate-y-1.5"}`} />
        </div>
      </button>

      {/* overlay موبایل */}
      {mobileOpen && (
        <div
          className="lg:hidden fixed inset-0 bg-black/50 z-30 animate-fade-in"
          onClick={() => setMobileOpen(false)}
        />
      )}

      {/* سایدبار دسکتاپ — قابل جمع شدن */}
      <aside
        className={`hidden lg:flex flex-col shrink-0 lux-sidebar min-h-dvh sticky top-0 h-screen transition-all duration-300 ease-in-out ${
          collapsed ? "w-14" : "w-44"
        }`}
      >
        {/* هدر + دکمه همبرگری */}
        <div className="flex items-center gap-2 h-14 border-b border-[rgba(212,175,55,0.15)] shrink-0">
          <button
            onClick={() => setCollapsed(!collapsed)}
            className="w-10 h-10 flex items-center justify-center rounded-lg hover:bg-[rgba(212,175,55,0.1)] transition-all active:scale-90 shrink-0"
            aria-label="جمع/باز کردن"
          >
            <div className="relative w-4 h-4 flex flex-col justify-center items-center">
              <span className={`absolute h-0.5 w-4 bg-[#d4af37] rounded-full transition-all duration-300 ${collapsed ? "rotate-45" : "-translate-y-1"}`} />
              <span className={`absolute h-0.5 w-4 bg-[#d4af37] rounded-full transition-all duration-300 ${collapsed ? "opacity-0" : "opacity-100"}`} />
              <span className={`absolute h-0.5 w-4 bg-[#d4af37] rounded-full transition-all duration-300 ${collapsed ? "-rotate-45" : "translate-y-1"}`} />
            </div>
          </button>
          {!collapsed && (
            <div className="flex items-center gap-1.5 overflow-hidden animate-fade-in">
              <span className="text-lg font-black lux-gold-text whitespace-nowrap">کندو</span>
              <span className="text-[10px] text-[#666] whitespace-nowrap">مدیریت</span>
            </div>
          )}
        </div>

        {/* ناوبری */}
        <nav className="flex-1 px-1.5 py-3 overflow-y-auto scrollbar-hide overflow-x-hidden">
          {groups.map((group) => {
            const GroupIcon = groupIcons[group.title] || LayoutDashboard;
            const isHovered = hoveredGroup === group.title;
            const hasActiveItem = group.items.some((item) => isActive(item.href));

            return (
              <div
                key={group.title}
                className="mb-1 relative"
                onMouseEnter={() => collapsed && setHoveredGroup(group.title)}
                onMouseLeave={() => collapsed && setHoveredGroup(null)}
              >
                {!collapsed && (
                  <p className="lux-group-title px-3 py-1.5 text-[10px] uppercase tracking-wide">{group.title}</p>
                )}
                {collapsed ? (
                  <>
                    {/* آیکون گروه در حالت بسته */}
                    <button
                      className={`flex items-center justify-center w-12 h-10 mx-auto rounded-lg transition-all ${
                        hasActiveItem ? "lux-nav-item-active" : "lux-nav-item"
                      }`}
                    >
                      <GroupIcon className="w-5 h-5" strokeWidth={hasActiveItem ? 2.5 : 1.5} />
                    </button>
                    {/* پاپ‌آور زیرمجموعه ها هنگام hover */}
                    {isHovered && (
                      <div className="absolute top-0 right-full mr-1 z-50 min-w-[180px] lux-sidebar rounded-xl border border-[rgba(212,175,55,0.15)] ig-shadow-lg py-2 animate-fade-in-up">
                        <p className="lux-group-title px-3 py-1 text-[10px] uppercase tracking-wide mb-1">{group.title}</p>
                        {group.items.map((item) => (
                          <Link
                            key={item.href}
                            href={item.href}
                            className={`flex items-center gap-2 px-3 py-2 rounded-lg font-bold text-xs mx-1 ${
                              isActive(item.href) ? "lux-nav-item-active" : "lux-nav-item"
                            }`}
                          >
                            <item.icon className="w-4 h-4" strokeWidth={isActive(item.href) ? 2.5 : 1.5} />
                            {item.label}
                          </Link>
                        ))}
                      </div>
                    )}
                  </>
                ) : (
                  group.items.map((item) => (
                    <Link
                      key={item.href}
                      href={item.href}
                      className={`flex items-center gap-2.5 px-3 py-2 rounded-lg font-bold text-xs transition-all ${
                        isActive(item.href) ? "lux-nav-item-active" : "lux-nav-item"
                      }`}
                    >
                      <item.icon className="w-4 h-4 shrink-0" strokeWidth={isActive(item.href) ? 2.5 : 1.5} />
                      <span className="truncate">{item.label}</span>
                    </Link>
                  ))
                )}
              </div>
            );
          })}
        </nav>

        {/* دکمه خروج */}
        <div className="border-t border-[rgba(212,175,55,0.15)] shrink-0">
          <button
            onClick={logout}
            className={`flex items-center gap-2 px-3 py-2.5 text-xs font-bold text-red-400/80 hover:text-red-400 hover:bg-red-500/10 transition-all rounded-lg ${
              collapsed ? "justify-center w-12 mx-auto" : "w-full"
            }`}
            title="خروج"
          >
            <LogOut className="w-4 h-4 shrink-0" strokeWidth={1.5} />
            {!collapsed && <span>خروج</span>}
          </button>
        </div>
      </aside>

      {/* سایدبار کشویی موبایل/تبلت */}
      <aside
        className={`lg:hidden fixed top-0 right-0 bottom-0 z-40 w-60 lux-sidebar transition-transform duration-300 ease-in-out flex flex-col ${
          mobileOpen ? "translate-x-0" : "translate-x-full"
        }`}
      >
        <div className="flex items-center justify-between h-14 border-b border-[rgba(212,175,55,0.15)] shrink-0 px-4">
          <div className="flex items-center gap-1.5">
            <span className="text-lg font-black lux-gold-text">کندو</span>
            <span className="text-[10px] text-[#666]">مدیریت</span>
          </div>
          <button
            onClick={() => setMobileOpen(false)}
            className="w-8 h-8 rounded-lg hover:bg-[rgba(212,175,55,0.1)] flex items-center justify-center transition-all active:scale-90"
          >
            <X className="w-5 h-5 text-[#d4af37]" />
          </button>
        </div>
        <nav className="flex-1 px-2 py-3 overflow-y-auto scrollbar-hide">
          {groups.map((group) => (
            <div key={group.title} className="mb-2">
              <p className="lux-group-title px-3 py-1.5 text-[10px] uppercase tracking-wide">{group.title}</p>
              {group.items.map((item) => (
                <Link
                  key={item.href}
                  href={item.href}
                  className={`flex items-center gap-2.5 px-3 py-2 rounded-lg font-bold text-xs ${
                    isActive(item.href) ? "lux-nav-item-active" : "lux-nav-item"
                  }`}
                >
                  <item.icon className="w-4 h-4" strokeWidth={isActive(item.href) ? 2.5 : 1.5} />
                  {item.label}
                </Link>
              ))}
            </div>
          ))}
        </nav>
        <div className="px-3 py-2 border-t border-[rgba(212,175,55,0.15)]">
          <button
            onClick={logout}
            className="flex items-center gap-2 px-3 py-2 text-xs font-bold text-red-400/80 hover:text-red-400 hover:bg-red-500/10 transition-all rounded-lg w-full"
          >
            <LogOut className="w-4 h-4" strokeWidth={1.5} />
            خروج
          </button>
        </div>
      </aside>
    </>
  );
}
