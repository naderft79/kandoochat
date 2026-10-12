// صفحه ماموریت ها — ماموریت های روزانه برای همه + دکمه ماموریت های ویژه برای کاربران ویژه
import { redirect } from "next/navigation";
import { getCurrentUser } from "@/lib/auth";
import MissionsClient from "@/components/dashboard/MissionsClient";

export default async function MissionsPage() {
  const user = await getCurrentUser();
  if (!user) redirect("/login");

  return <MissionsClient isSpecial={user.isSpecial} />;
}
