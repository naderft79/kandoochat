// صفحه مدیریت اپ ها — تنظیمات جداگانه هر برند در پنل ادمین
import { BRANDS, DEFAULT_BRAND } from "@/lib/brands";
import { getBrandTheme, brandCssVars } from "@/lib/brand-theme";
import AdminAppsClient from "@/components/admin/AdminAppsClient";

export default function AdminAppsPage() {
  // تب اول همیشه اپ اصلی کندو است — بقیه از brands.json می آیند
  const brands = [DEFAULT_BRAND, ...BRANDS].map((b) => {
    const theme = getBrandTheme(b);
    return {
      id: b.id,
      name: b.name,
      nameEn: b.nameEn ?? "",
      color: b.colors.primary,
      preview: {
        vars: brandCssVars(b, theme),
        navIndicator: theme.navIndicator,
        letter: b.iconLetter ?? b.name.trim()[0] ?? "ک",
        welcome: b.texts?.welcomeTitle ?? `به ${b.name} خوش آمدی`,
        sub: b.texts?.welcomeSub ?? b.slogan,
      },
    };
  });
  return <AdminAppsClient brands={brands} />;
}
