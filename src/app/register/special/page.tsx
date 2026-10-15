// صفحه ثبت نام ویژه با slug ثابت special (برای backward compatibility)
// اگر اسلاگ تنظیمات خودِ «special» است همینجا فرم را رندر می کنیم تا لوپ ریدایرکت نشود
import { redirect } from "next/navigation";
import { getAllSettings } from "@/lib/settings";
import SpecialRegisterForm from "@/components/auth/SpecialRegisterForm";

export default async function SpecialRegisterPage() {
  const settings = await getAllSettings();
  const slug = settings.specialRegisterSlug;

  // اسلاگ پیش فرض خود special است — ریدایرکت به خودش لوپ می سازد
  if (!slug) redirect("/register");
  if (slug === "special") return <SpecialRegisterForm slug={slug} />;
  redirect(`/register/${slug}`);
}
