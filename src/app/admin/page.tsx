// داشبورد مدیریت: تم لاکچری طلایی-مشکی
import Link from "next/link";
import { LayoutDashboard, Users, Activity, Wallet, BadgeCheck, Zap } from "lucide-react";
import { getAllSettings } from "@/lib/settings";
import { formatToman } from "@/lib/format";
import AdminCharts from "@/components/admin/AdminCharts";
import FreeWeekToggle from "@/components/admin/FreeWeekToggle";
import AdminAlertsBanner from "@/components/admin/AdminAlertsBanner";
import QrLoginCard from "@/components/admin/QrLoginCard";
import NotificationTester from "@/components/admin/NotificationTester";
import { qrLoginEnabled } from "@/lib/qr-login";

const QUICK_LINKS = [
  { href: "/admin/users", label: "مدیریت کاربران", icon: Users },
  { href: "/admin/visits", label: "انالیز لحظه ای", icon: Activity },
  { href: "/admin/finance", label: "مالی", icon: Wallet },
  { href: "/admin/photos", label: "تایید عکس", icon: BadgeCheck },
];

export default async function AdminDashboardPage() {
  const settings = await getAllSettings();
  const showQr = qrLoginEnabled();

  return (
    <div className="space-y-6">
      {/* دسترسی سریع */}
      <div className="lux-card p-4">
        <h2 className="text-sm font-bold text-[#e8e8e8] flex items-center gap-2 mb-3">
          <Zap className="w-4 h-4 text-[#d4af37]" />
          دسترسی سریع
        </h2>
        <div className="grid grid-cols-2 gap-2 sm:grid-cols-4">
          {QUICK_LINKS.map((l) => (
            <Link
              key={l.href}
              href={l.href}
              className="lux-btn-outline flex items-center justify-center gap-1.5 py-1.5 rounded-lg text-xs font-bold"
            >
              <l.icon className="w-3.5 h-3.5" />
              {l.label}
            </Link>
          ))}
        </div>
      </div>

      {/* کارت داشبورد و قانون اشتراک یک هفته ای در یک ردیف */}
      <div className="grid grid-cols-1 gap-4 items-stretch lg:grid-cols-2">
        <div className="lux-card p-5">
          <h1 className="text-lg font-black text-[#e8e8e8] flex items-center gap-2">
            <LayoutDashboard className="w-5 h-5 text-[#d4af37]" />
            داشبورد مدیریت
          </h1>
          <p className="text-[#888] mt-1 text-xs">
            ارزش هر سکه: {formatToman(settings.coinValue)} — قیمت اشتراک: {formatToman(settings.subscriptionPrice)}
          </p>
        </div>
        <FreeWeekToggle initial={settings.freeWeekSubscription} />
      </div>

      {/* QR لاگین سریع با گوشی — فقط دسکتاپ */}
      {showQr && <QrLoginCard />}

      {/* بنر هشدارهای الزامی */}
      <AdminAlertsBanner />

      {/* نمودارها و آمار پیشرفته */}
      <AdminCharts />

      {/* تست بخش ها — ارسال اعلان های آزمایشی */}
      <NotificationTester />
    </div>
  );
}
