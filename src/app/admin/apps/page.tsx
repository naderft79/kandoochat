// صفحه مدیریت اپ ها — تنظیمات جداگانه هر برند در پنل ادمین
import { BRANDS, DEFAULT_BRAND } from "@/lib/brands";
import AdminAppsClient from "@/components/admin/AdminAppsClient";

export default function AdminAppsPage() {
  // تب اول همیشه اپ اصلی کندو است — بقیه از brands.json می آیند
  const brands = [
    { id: DEFAULT_BRAND.id, name: DEFAULT_BRAND.name, nameEn: DEFAULT_BRAND.nameEn ?? "", color: DEFAULT_BRAND.colors.primary },
    ...BRANDS.map((b) => ({ id: b.id, name: b.name, nameEn: b.nameEn ?? "", color: b.colors.primary })),
  ];
  return <AdminAppsClient brands={brands} />;
}
