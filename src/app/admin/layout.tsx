// چیدمان پنل مدیریت: تم لاکچری طلایی-مشکی
import { redirect } from "next/navigation";
import { getCurrentUser, ADMIN_ROLES } from "@/lib/auth";
import AdminNav from "@/components/admin/AdminNav";
import AdminStatsHeader from "@/components/admin/AdminStatsHeader";
import SeyyedWarningModal from "@/components/admin/SeyyedWarningModal";
import { ThemeToggle } from "@/components/ThemeProvider";
import UserModalProvider from "@/components/admin/user-modal/UserModalProvider";

export default async function AdminLayout({ children }: LayoutProps<"/admin">) {
  const user = await getCurrentUser();
  if (!user) redirect("/login");
  if (!ADMIN_ROLES.includes(user.role as any)) redirect("/dashboard");

  return (
    <UserModalProvider>
      {/* مودال هشدار ویژه آقا سید — هر ورود یک بار (شناسایی با فیلد موبایل داخلی) */}
      {user.phone === "admin-seyyed" && <SeyyedWarningModal />}
      <div className="flex min-h-dvh lux-admin-bg text-[#e8e8e8]">
        <AdminNav />
        <main className="flex-1 p-4 sm:px-8 sm:pt-8 pb-24 lg:pb-8 w-full overflow-x-hidden">
          <div className="flex justify-end mb-3">
            <ThemeToggle />
          </div>
          <AdminStatsHeader />
          {children}
        </main>
      </div>
    </UserModalProvider>
  );
}
