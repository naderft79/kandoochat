// صفحه مدیریت استوری — ادمین
import { redirect } from "next/navigation";
import { getCurrentUser } from "@/lib/auth";
import AdminStoriesClient from "@/components/admin/AdminStoriesClient";

export default async function AdminStoriesPage() {
  const user = await getCurrentUser();
  if (!user) redirect("/login");
  // دسترسی به همه نقش های ادمین در layout بررسی می شود

  return <AdminStoriesClient />;
}
