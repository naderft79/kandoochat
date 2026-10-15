// صفحه ثبت نام ویژه با slug ثابت special (برای backward compatibility)
// به اسلاگ واقعی تنظیم شده در پنل ادمین ریدایرکت می کند
import { redirect } from "next/navigation";
import { getAllSettings } from "@/lib/settings";

export default async function SpecialRegisterPage() {
  const settings = await getAllSettings();
  redirect(`/register/${settings.specialRegisterSlug}`);
}
