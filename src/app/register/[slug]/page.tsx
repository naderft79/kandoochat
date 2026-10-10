// صفحه داینامیک ثبت نام ویژه — slug از تنظیمات ادمین خوانده می شود
import { redirect } from "next/navigation";
import { getAllSettings } from "@/lib/settings";
import SpecialRegisterForm from "@/components/auth/SpecialRegisterForm";

export default async function SpecialRegisterSlugPage({
  params,
}: {
  params: Promise<{ slug: string }>;
}) {
  const { slug } = await params;
  const settings = await getAllSettings();

  if (slug !== settings.specialRegisterSlug) {
    redirect("/register");
  }

  return <SpecialRegisterForm />;
}
