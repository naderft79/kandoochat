// صفحه آمار پیشرفته ادمین — داده اولیه از سرور و به‌روزرسانی زنده در کلاینت
import { getAdminStats } from "@/lib/admin-stats";
import StatsDashboardClient from "@/components/admin/StatsDashboardClient";

export const dynamic = "force-dynamic";

export default async function AdminStatsPage() {
  const initial = await getAdminStats();
  return <StatsDashboardClient initial={initial} />;
}
