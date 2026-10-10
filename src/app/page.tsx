// نقطه ورود اپ — لندینگ پیج نمایش داده نمی شود:
// وارد شده -> داشبورد / اولین بازدید -> صفحات راهنما / آموزش دیده -> ثبت نام
import { getSession } from "@/lib/auth";
import { cookies } from "next/headers";
import { redirect } from "next/navigation";

export const dynamic = "force-dynamic";

export default async function HomePage() {
  const session = await getSession();
  if (session) redirect("/dashboard");

  const cookieStore = await cookies();
  redirect(cookieStore.get("kandoo-onboarded") ? "/register" : "/onboarding");
}
