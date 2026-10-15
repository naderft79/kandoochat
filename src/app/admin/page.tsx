// داشبورد مدیریت: تم لاکچری طلایی-مشکی
import { LayoutDashboard } from "lucide-react";
import { getAllSettings } from "@/lib/settings";
import { formatToman } from "@/lib/format";
import AdminCharts from "@/components/admin/AdminCharts";
import FreeWeekToggle from "@/components/admin/FreeWeekToggle";
import AdminAlertsBanner from "@/components/admin/AdminAlertsBanner";
import QrLoginCard from "@/components/admin/QrLoginCard";
import NotificationTester from "@/components/admin/NotificationTester";
import { qrLoginEnabled } from "@/lib/qr-login";

export default async function AdminDashboardPage() {
  const settings = await getAllSettings();
  const showQr = qrLoginEnabled();

  return (
    <div className="space-y-6">
      {/* قانون اشتراک یک هفته ای رایگان برای اعضای دعوت شده */}
      <FreeWeekToggle initial={settings.freeWeekSubscription} />

      {/* کارت داشبورد و کارت ورود سریع کنار هم (دسکتاپ)؛ اگر QR فعال نباشد، کارت داشبورد تمام عرض می ماند */}
      <div className={`grid grid-cols-1 gap-4 items-stretch ${showQr ? "lg:grid-cols-2" : ""}`}>
        <div className="lux-card p-5">
          <h1 className="text-lg font-black text-[#e8e8e8] flex items-center gap-2">
            <LayoutDashboard className="w-5 h-5 text-[#d4af37]" />
            داشبورد مدیریت
          </h1>
          <p className="text-[#888] mt-1 text-xs">
            ارزش هر سکه: {formatToman(settings.coinValue)} — قیمت اشتراک: {formatToman(settings.subscriptionPrice)}
          </p>
        </div>

        {/* QR لاگین سریع با گوشی — فقط دسکتاپ */}
        {showQr && <QrLoginCard />}
      </div>

      {/* بنر هشدارهای الزامی */}
      <AdminAlertsBanner />

      {/* نمودارها و آمار پیشرفته */}
      <AdminCharts />

      {/* تست بخش ها — ارسال اعلان های آزمایشی */}
      <NotificationTester />
    </div>
  );
}
