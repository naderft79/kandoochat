// چیدمان پنل کاربری — سبک اینستاگرام
import { redirect } from "next/navigation";
import { getCurrentUser, isImpersonating, ADMIN_ROLES } from "@/lib/auth";
import { getAllSettings } from "@/lib/settings";
import DashboardNav from "@/components/dashboard/DashboardNav";
import ImpersonateBanner from "@/components/dashboard/ImpersonateBanner";
import PullToRefresh from "@/components/dashboard/PullToRefresh";
import PushConsentSheet from "@/components/pwa/PushConsentSheet";

export default async function DashboardLayout({
  children,
}: LayoutProps<"/dashboard">) {
  const user = await getCurrentUser();
  if (!user) redirect("/login");

  const settings = await getAllSettings();
  if (settings.maintenanceMode && !(ADMIN_ROLES as readonly string[]).includes(user.role)) {
    redirect("/maintenance");
  }

  const impersonating = await isImpersonating();

  return (
    <div className="flex h-[100dvh] overflow-hidden bg-surface">
      {/* LiveDataProvider در root layout است — اینجا فقط مصرف کننده ایم */}
      <DashboardNav
        fullName={`${user.firstName} ${user.lastName}`}
        userPhoto={user.photos?.[0]?.url ?? null}
      />
      <main className="flex-1 h-[100dvh] overflow-y-auto overscroll-none no-scrollbar pb-[calc(3.75rem+env(safe-area-inset-bottom))] lg:pb-0 w-full md:max-w-[640px] lg:max-w-none mx-auto">
        {impersonating && <ImpersonateBanner />}
        <PullToRefresh>{children}</PullToRefresh>
      </main>
      <PushConsentSheet />
    </div>
  );
}
