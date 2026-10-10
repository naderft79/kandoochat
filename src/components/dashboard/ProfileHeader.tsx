"use client";

// سربرگ پروفایل: نام کاربری راست، «اشتراک گذاری» و «منو» چپ (مثل اینستاگرام معکوس برای RTL)
import { useState } from "react";
import { usePathname, useRouter } from "next/navigation";
import Link from "next/link";
import { Menu, Crown, Headset, Settings, HelpCircle, FileText, LogOut } from "lucide-react";
import PageHeader from "@/components/dashboard/PageHeader";
import { BottomSheet } from "@/components/ui/Modal";
import IconButton from "@/components/ui/IconButton";
import ListRow from "@/components/ui/ListRow";

const items = [
  { href: "/dashboard/support", label: "پشتیبانی", icon: Headset },
  { href: "/dashboard/settings", label: "تنظیمات", icon: Settings },
  { href: "/help", label: "راهنما و سوالات متداول", icon: HelpCircle },
  { href: "/terms", label: "قوانین و مقررات", icon: FileText },
];

export default function ProfileHeader({ username }: { username: string }) {
  const [menuOpen, setMenuOpen] = useState(false);
  const router = useRouter();
  const pathname = usePathname();


  // با تغییر مسیر منو بسته می شود — در زمان رندر (الگوی رسمی ری‌اکت)
  const [lastPath, setLastPath] = useState(pathname);
  if (pathname !== lastPath) {
    setLastPath(pathname);
    setMenuOpen(false);
  }

  async function logout() {
    await fetch("/api/auth/logout", { method: "POST" });
    router.push("/");
    router.refresh();
  }

  return (
    <>
      <PageHeader
        center={<h1 className="text-lg font-bold text-foreground truncate" dir="ltr">{username}</h1>}
        right={
          /* دکمه اشتراک — استایل چیپ طوسی مثل دکمه سکه در هدر خانه */
          <Link
            href="/dashboard/subscription"
            aria-label="اشتراک"
            className="flex items-center gap-1.5 h-9 px-3 rounded-full bg-ig-divider hover:bg-ig-btn2-hover transition-colors active:scale-95"
          >
            <span className="text-sm font-bold text-foreground">اشتراک</span>
            <Crown className="w-4 h-4 text-ig-gold" fill="currentColor" aria-hidden />
          </Link>
        }
        left={
          <IconButton aria-label="منو" onClick={() => setMenuOpen(true)}>
            <Menu className="w-6 h-6" strokeWidth={2} aria-hidden />
          </IconButton>
        }
      />

      <BottomSheet open={menuOpen} onClose={() => setMenuOpen(false)} title="منو">
        <nav className="py-1">
          {items.map((it) => (
            <ListRow key={it.href} href={it.href} icon={it.icon} title={it.label} />
          ))}
          <ListRow icon={LogOut} title="خروج از حساب" tone="danger" onClick={logout} end={<span />} />
        </nav>
      </BottomSheet>
    </>
  );
}
